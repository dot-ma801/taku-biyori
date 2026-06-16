---
name: pr-review-cycle
description: >
  PR レビューサイクルを自動化する。Agent A がレビュー・インラインコメントを投稿し、
  Agent B が PR を監視して修正対応する。修正後 Agent A が再レビューするサイクルを繰り返す。
  「PR をレビューして」「レビューサイクルを回して」「PR #N を自動レビュー」と言われたら使う。
---

2 エージェントで PR レビュー（Agent A）と修正対応（Agent B）を並行実行し、
CI グリーン・全指摘解消まで自動でサイクルを回す。

引数:
- `owner` : GitHub オーナー名（例: `dot-ma801`）
- `repo`  : リポジトリ名（例: `taku-biyori`）
- `pr`    : PR 番号（例: `18`）

## 実行手順

### Step 1: PR 情報を事前取得してコンテキストを共有

```
mcp__github__pull_request_read (method: "get")        → PR タイトル・ブランチ名・マージ可能状態
mcp__github__pull_request_read (method: "get_files")  → 変更ファイル一覧
mcp__github__pull_request_read (method: "get_check_runs") → CI 状態
```

加えて、リポジトリルートの `CLAUDE.md`（存在すれば）を取得しておく:

```
mcp__github__file_read (path: "CLAUDE.md", owner: {owner}, repo: {repo})
```

取得した CLAUDE.md の内容を `{claude_md}` として保持し、両エージェントのプロンプトに埋め込む。
ファイルが存在しない場合は `{claude_md} = ""` として続行する。

これらをすべて取得してから両エージェントに渡す（重複取得を避けトークン節約）。

### Step 2: Agent A（レビュアー）を起動

以下のプロンプトで Agent を起動（`run_in_background: false` で foreground 実行）:

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

Agent A の結果（レビューコメント一覧・サマリー）を受け取ってから、以下のプロンプトで Agent を起動（`run_in_background: false`）:

> **設計メモ**: Agent B は購読・監視ではなく、Agent A から直接渡された指摘リストを元に処理する。
> 非同期 Webhook に依存しないシーケンシャルなフロー。

```
あなたは修正担当（Agent B）です。以下のレビュー指摘に対応して修正・コミット・プッシュしてください。

## PR 情報
- PR 番号: #{pr}
- ブランチ: {branch}（作業ブランチ）
- owner: "{owner}", repo: "{repo}"

## Agent A のレビュー指摘（解消すべき内容）
{review_comments}

※ REQUEST_CHANGES が 0 件の場合はそのまま終了してください。

## 手順
1. 上記の指摘を一つずつ処理:
   a. `get_file_contents` で対象ファイルを取得 (branch: "{branch}")
   b. 問題を修正
   c. `push_files` でコミット（メッセージ: "[fix] レビュー指摘対応: {内容}"）
   d. `add_reply_to_pull_request_comment` で対応完了を返信
2. 全指摘の修正完了後、`get_check_runs` で CI 状態を確認し、失敗していれば:
   a. `get_job_logs` でエラー確認
   b. ローカルで lint/format を実行して修正
   c. `push_files` でプッシュ
3. 完了したら修正内容のサマリーを報告する

## CLAUDE.md ルール（コミット・フォーマット）
{claude_md}

CLAUDE.md が空の場合はリポジトリの標準的なコミット規約に従う。
```

### Step 4: 再レビューサイクル

Agent B が修正をプッシュしたら、Agent A に再レビューを依頼:

```
PR #{pr} の再レビューをしてください。

## 前回の指摘と Agent B の修正内容
{Agent Bから報告された修正内容}

## 確認手順
1. `get_diff` で最新 diff を取得
2. `get_review_comments` で未解決スレッドを確認
3. 各指摘が解消されていれば APPROVE、残課題があれば REQUEST_CHANGES

owner: "{owner}", repo: "{repo}", pullNumber: {pr}
```

### Step 5: 完了判定

以下の条件を満たしたらサイクル終了:
- CI 全ジョブ success
- 未解決レビューコメント 0 件
- Agent A が APPROVE または「問題なし」と判定

## トークン最適化ポイント

| 最適化 | 方法 |
|---|---|
| diff の重複取得を避ける | Step 1 で取得した情報を両エージェントのプロンプトに埋め込む |
| CLAUDE.md の重複取得を避ける | Step 1 で一度だけ取得し、両エージェントに渡す |
| Agent B への指摘転送 | レビュー全体サマリーを転送（全コメントの個別転送は不要） |
| 再レビューの絞り込み | 変更されたファイルのみ確認するよう指示 |
| CI エラーの即時対応 | Agent B がローカルで lint/format を先に実行してから push |
| CodeRabbit/bot コメントは無視 | `Author: coderabbitai[bot]` のコメントはスキップ |

## Gotchas

- **自己レビュー制限**: GitHub は PR 作成者が APPROVE できない。`COMMENT` で代替。
- **CI format エラー**: Prettier の長行折り返しは `pnpm format` で自動修正可。push 前に必ず実行。
- **未使用インポート**: Agent B が型インポートを追加した後、使わない型が残ってエラーになりやすい。lint で確認。
- **push_files と相対パス**: `get_file_contents` → `push_files` のパスは repo root からの相対パス（例: `packages/backend/src/...`）。
- **CodeRabbit レート制限**: 短時間に複数コミットするとレート制限に引っかかる。対応不要。
