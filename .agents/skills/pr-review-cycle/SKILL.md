---
name: pr-review-cycle
description: >
  PR レビューサイクルを自動化する。Agent A がレビュー・インラインコメントを投稿し、 Agent B が PR を監視して修正対応する。修正後
  Agent A が再レビューするサイクルを繰り返す。 Agent A 自身の指摘だけでなく、ユーザ（人間）・他の AI エージェント・レビュー
  bot（CodeRabbit 等） からの指摘も投稿者を問わず対応対象に含める。 「PR をレビューして」「レビューサイクルを回して」「PR #N
  を自動レビュー」 「レビューコメントに対応して」と言われたら使う。
---
2 エージェントで PR レビュー（Agent A）と修正対応（Agent B）を並行実行し、
CI グリーン・全指摘解消まで自動でサイクルを回す。

引数:
- `owner` : GitHub オーナー名（例: `dot-ma801`）
- `repo`  : リポジトリ名（例: `taku-biyori`）
- `pr`    : PR 番号（例: `18`）

## モデル割り当て

各サブエージェントは役割に応じてモデルを固定する:

| エージェント | 役割 | モデル | 理由 |
|---|---|---|---|
| Agent A | レビュアー（指摘の質が成果を左右） | `opus` | 設計・型・エッジケースの深い読みが必要 |
| Agent B | 修正担当（手数が多い実装作業） | `sonnet` | 速度とコスト効率を優先、指摘は A が言語化済み |

エージェント起動時は必ず `model` パラメータを明示する（指定漏れだと既定モデルにフォールバックして分担が崩れる）。再レビュー（Step 4）も Agent A の役割なので `opus` を使う。

## スレッド対応方針

レビューで開かれたスレッド（インラインコメントの会話）には状態を持たせ、状態遷移で管理する。
各スレッドは最終的に **RESOLVED** か **WONTFIX** のどちらかに必ず収束させる。

### 対応対象のコメントソース

**投稿者を問わず、PR 上の全 unresolved スレッドを対応対象とする。** 以下すべてを処理する:

| ソース | 例 | 扱い |
|---|---|---|
| Agent A（本サイクルのレビュアー） | 自身のインライン指摘 | 通常フロー |
| 人間レビュアー | チームメンバー・PR 作成者本人の指摘 | 同様に対応。**解決後は A が resolve** |
| 他の AI エージェント | 別 Claude セッション等 | 同様に対応 |
| レビュー bot | `coderabbitai[bot]` 等 | 同様に対応（無視しない） |

> 以前は bot コメントを無視する設計だったが、**現在は撤廃**。bot の指摘も他と同様に
> fix / WONTFIX のどちらかに収束させる。ノイズが多い bot の指摘でも、対応不要と判断したら
> 黙殺せず WONTFIX として理由を返信する。

スレッド収集は `get_review_comments`（および PR トップレベルコメント一覧）で行い、`resolved == false`
のスレッドを投稿者で絞らず全件リストアップする。

| 状態 | 意味 | 遷移させる主体 |
|---|---|---|
| `OPEN` | 指摘投稿直後・未対応 | Agent A（投稿時） |
| `FIXED` | B が修正 push + 返信済み、A の確認待ち | Agent B |
| `RESOLVED` | A が再レビューで修正を確認し resolve 済み | **Agent A のみ** |
| `WONTFIX` | B が「直さない」と判断、理由を返信して人間判断へエスカレーション | Agent B（A は resolve しない） |

### ルール

1. **resolve は Agent A の専権**。投稿者が人間・bot・他エージェントでも区別せず、A が再レビューで diff を確認して解消されていれば resolve する。B は修正・返信するだけで resolve しない（自己採点を防ぐ）。
2. **全コメントが必須対応**。投稿者やノイズ度に関係なく、すべてのスレッドを RESOLVED か WONTFIX に収束させる。nitpick 扱いで握りつぶさない。
3. **直さない判断をしたら WONTFIX**。黙ってスルーは禁止。必ず理由を返信し、スレッドは開いたまま人間に委ねる（A も resolve しない）。bot の指摘でも同じ。
4. **WONTFIX は自動サイクルのブロッキング対象から外す**（無限ループ防止）。ただし完了報告で必ず一覧提示し、人間の最終判断を仰ぐ。

> **要確認（MCP 依存）**: スレッドの resolve 操作は GitHub の `resolveReviewThread`（GraphQL mutation）に相当する。
> 利用中の GitHub MCP がこの操作を直接サポートしているか確認すること。
> サポートされていない場合のフォールバック: Agent A が当該スレッドに `✅ 確認済み・解消` と返信し、
> 状態を論理的に RESOLVED とみなして完了判定に進む（GitHub UI 上の解決マークは人間が付ける）。

## 実行手順

### Step 1: PR 情報を事前取得してコンテキストを共有

```
mcp__github__pull_request_read (method: "get")        → PR タイトル・ブランチ名・マージ可能状態
mcp__github__pull_request_read (method: "get_files")  → 変更ファイル一覧
mcp__github__pull_request_read (method: "get_check_runs") → CI 状態
mcp__github__get_review_comments                      → 既存の unresolved スレッド一覧
```

`get_review_comments`（＋ PR トップレベルコメント）で、Agent A のレビュー前から存在する
**人間・他エージェント・bot の指摘**を収集しておく。`resolved == false` のものを投稿者で絞らず
`{existing_threads}` として保持し、Agent B の対応対象に合流させる（「スレッド対応方針」参照）。

加えて、リポジトリルートの `CLAUDE.md`（存在すれば）を取得しておく:

```
mcp__github__file_read (path: "CLAUDE.md", owner: {owner}, repo: {repo})
```

取得した CLAUDE.md の内容を `{claude_md}` として保持し、両エージェントのプロンプトに埋め込む。
ファイルが存在しない場合は `{claude_md} = ""` として続行する。

これらをすべて取得してから両エージェントに渡す（重複取得を避けトークン節約）。

### Step 2: Agent A（レビュアー）を起動

以下のプロンプトで Agent を起動。
**起動パラメータ: `model: "opus"`, `run_in_background: false`（foreground 実行）**

```
あなたはレビュアー（Agent A）です。PR #{pr} を詳細にコードレビューし、
GitHub にインラインコメントを投稿してください。

## PR 情報（事前取得済み）
- タイトル: {title}
- ブランチ: {branch}
- 変更ファイル: {files}

## レビュー観点
CLAUDE.md の内容に従ってください。
CLAUDE.md が空の場合は一般的なコードレビュー観点（型安全性・命名・設計・テスト・エラーハンドリング）で判断してください。

{claude_md}

## 投稿手順
1. `pull_request_review_write` (method: create) で pending review 作成
2. `add_comment_to_pending_review` で各ファイルにインラインコメント
3. `pull_request_review_write` (method: submit_pending, event: "REQUEST_CHANGES" or "COMMENT")

日本語でコメントを記載。問題なければ APPROVE。
owner: "{owner}", repo: "{repo}", pullNumber: {pr}

## 完了後の出力
レビュー投稿後、以下の形式で指摘一覧を出力してください（Agent B への引き継ぎ用）:

[REVIEW_COMMENTS]
- {ファイルパス} L{行番号}: {指摘内容}
- ...
[/REVIEW_COMMENTS]

REQUEST_CHANGES が 0 件の場合は [REVIEW_COMMENTS][/REVIEW_COMMENTS] と空で出力。
```

### Step 3: Agent B（修正担当）を起動

Agent A の結果（レビューコメント一覧・サマリー）を受け取ってから、以下のプロンプトで Agent を起動。
**起動パラメータ: `model: "sonnet"`, `run_in_background: false`**

> **設計メモ**: Agent B は購読・監視ではなく、Agent A から直接渡された指摘リストを元に処理する。
> 非同期 Webhook に依存しないシーケンシャルなフロー。

```
あなたは修正担当（Agent B）です。以下のレビュー指摘に対応して修正・コミット・プッシュしてください。

## PR 情報
- PR 番号: #{pr}
- ブランチ: {branch}（作業ブランチ）
- owner: "{owner}", repo: "{repo}"

## 対応すべき指摘（投稿者を問わず全件）
Agent A のレビュー指摘:
{review_comments}

それ以外の unresolved スレッド（人間・他エージェント・bot からの指摘）:
{existing_threads}

※ 投稿者で区別せず、上記すべてを fix か WONTFIX に収束させること。
※ すべて 0 件の場合はそのまま終了してください。

## 手順
1. 上記の指摘を一つずつ処理。各スレッドは「修正する」か「直さない」かを判断:

   **【修正する場合】**
   a. `get_file_contents` で対象ファイルを取得 (branch: "{branch}")
   b. 問題を修正
   c. `push_files` でコミット（メッセージ: "[fix] レビュー指摘対応: {内容}"）
   d. `add_reply_to_pull_request_comment` で対応完了を返信
   → このスレッドの状態は FIXED（A の確認待ち）。**自分で resolve はしない。**

   **【直さないと判断した場合（WONTFIX）】**
   a. 黙ってスルーは禁止。`add_reply_to_pull_request_comment` で「直さない理由」を必ず返信
      （例: 仕様上の意図的な実装 / 既存挙動との互換性 / 別 PR で対応予定 など）
   b. スレッドは**開いたまま**にする。resolve しない。
   c. このスレッドは人間の最終判断に委ねる（WONTFIX）。

2. 全指摘の対応完了後、`get_check_runs` で CI 状態を確認し、失敗していれば:
   a. `get_job_logs` でエラー確認
   b. ローカルで lint/format を実行して修正
   c. `push_files` でプッシュ
3. 完了したら以下の形式でサマリーを報告する（Agent A の再レビュー引き継ぎ用）:

   [FIX_SUMMARY]
   - FIXED  {ファイルパス} L{行番号}: {修正内容}
   - WONTFIX {ファイルパス} L{行番号}: {直さない理由}
   - ...
   [/FIX_SUMMARY]

※ B は一切 resolve しない（resolve は Agent A の専権）。

## CLAUDE.md ルール（コミット・フォーマット）
{claude_md}

CLAUDE.md が空の場合はリポジトリの標準的なコミット規約に従う。
```

### Step 4: 再レビューサイクル

Agent B が修正をプッシュしたら、Agent A に再レビューを依頼。
**起動パラメータ: `model: "opus"`（Agent A の役割を維持）, `run_in_background: false`**

```
PR #{pr} の再レビューをしてください。

## 前回の指摘と Agent B の対応内容
{Agent B から報告された [FIX_SUMMARY]（FIXED / WONTFIX の一覧）}

## 確認手順
1. `get_diff` で最新 diff を取得
2. `get_review_comments` で全スレッドの状態を確認
3. スレッドを一つずつ判定して状態遷移させる:
   - **FIXED（B が修正済み）** → diff で実際に解消されているか確認:
     - 解消されていれば **resolve**（→ RESOLVED）
     - まだ不十分なら resolve せず、追加指摘を返信（→ OPEN のまま、次サイクルへ）
   - **WONTFIX（B が理由付きで直さないと返信）** → resolve しない。理由が妥当か確認し、
     妥当なら触らず人間判断に残す／不当だと思えば反論を返信して修正を再依頼（→ OPEN）
4. 全スレッドが RESOLVED か WONTFIX に収束していれば APPROVE（自己レビュー制限時は COMMENT）、
   未解決（OPEN）が残れば REQUEST_CHANGES

owner: "{owner}", repo: "{repo}", pullNumber: {pr}
```

> resolve 操作の MCP サポート可否は「スレッド対応方針」の要確認メモを参照。
> 直接 resolve できない場合は `✅ 確認済み・解消` の返信で論理的に RESOLVED 扱いとする。

### Step 5: 完了判定

以下の条件をすべて満たしたらサイクル終了:
- CI 全ジョブ success
- **全スレッドが RESOLVED または WONTFIX に収束**（OPEN / A 未確認の FIXED が 0 件）
- Agent A が APPROVE または「問題なし」と判定

WONTFIX（人間判断待ち）のスレッドが残っている場合は、完了報告に必ず一覧を載せて人間に提示する:

```
[要人間判断 / WONTFIX]
- {ファイルパス} L{行番号}: {指摘内容} → {B の直さない理由}
- ...
```

WONTFIX はサイクルを止めない（ブロッキングしない）が、PR マージ前に人間が目を通す前提。

### Step 6: マージ可能コメントを投稿

Step 5 の完了条件を満たしたら、**マージ可能になった旨を PR にコメントする**。

投稿前に GitHub 上のマージ可能状態を取り直して確認する（CI・レビューが OK でもコンフリクトがあると実際にはマージできないため）:

```
mcp__github__pull_request_read (method: "get") → mergeable / mergeable_state を確認
```

- **`mergeable == true`（コンフリクトなし）** → 下記の「マージ可能コメント」を投稿してサイクル正常終了。
- **`mergeable == false`（コンフリクト等）** → マージ可能コメントは投稿せず、Agent B に
  `{branch}` への base ブランチ取り込み（rebase / merge）とコンフリクト解消を依頼してから再判定。

PR トップレベルへのコメント投稿:

```
mcp__github__add_issue_comment (owner, repo, issue_number: {pr}, body: <下記テンプレート>)
```
（※ MCP のメソッド名は環境により `add_issue_comment` / PR コメント用メソッドが異なる。要確認）

#### マージ可能コメント テンプレート

```
✅ マージ可能になりました

- CI: 全ジョブ success
- レビュースレッド: 全 {n} 件解決済み（RESOLVED）
- マージコンフリクト: なし

{WONTFIX が 1 件以上ある場合のみ以下を付記}
⚠️ 以下は「直さない」と判断したスレッドです。マージ前にご確認ください:
- {ファイルパス} L{行番号}: {指摘内容} → {直さない理由}
```

WONTFIX が 0 件なら警告ブロックは省略し、シンプルに「マージ可能」だけ通知する。

## トークン最適化ポイント

| 最適化 | 方法 |
|---|---|
| diff の重複取得を避ける | Step 1 で取得した情報を両エージェントのプロンプトに埋め込む |
| CLAUDE.md の重複取得を避ける | Step 1 で一度だけ取得し、両エージェントに渡す |
| Agent B への指摘転送 | レビュー全体サマリーを転送（全コメントの個別転送は不要） |
| 再レビューの絞り込み | 変更されたファイルのみ確認するよう指示 |
| CI エラーの即時対応 | Agent B がローカルで lint/format を先に実行してから push |
| スレッドの重複収集を避ける | Step 1 で全 unresolved スレッドを一度収集し、Agent A の新規指摘とマージして渡す |

## Gotchas

- **自己レビュー制限**: GitHub は PR 作成者が APPROVE できない。`COMMENT` で代替。
- **CI format エラー**: Prettier の長行折り返しは `pnpm format` で自動修正可。push 前に必ず実行。
- **未使用インポート**: Agent B が型インポートを追加した後、使わない型が残ってエラーになりやすい。lint で確認。
- **push_files と相対パス**: `get_file_contents` → `push_files` のパスは repo root からの相対パス（例: `packages/backend/src/...`）。
- **CodeRabbit レート制限**: 短時間に複数コミットすると CodeRabbit 側のレビュー生成がレート制限される。bot の指摘も対応対象になったが、bot の追従が遅れることがある点に留意（待つか、出揃った分だけ先に対応）。
- **bot のノイズ指摘**: スタイル論争や誤検知など対応不要な bot 指摘も、黙殺せず WONTFIX として理由を返信する（全コメント収束の原則）。
- **PR 作成者本人のコメント**: 人間（作成者含む）のスレッドも A が resolve する方針。ただし作成者が議論を続ける意図のスレッドを早閉じしないよう、未解決の問いかけが残っていないか確認してから resolve する。
