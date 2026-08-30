# 移行タスク着手手順（タスク3〜7 共通）

> 対象: [移行計画](./migration-plan-concept-model.md) のタスク3〜7（issue #113〜#117）
> 前提: タスク0（#110・マージ済み）/ タスク1（#111・design-v2 と openapi.yml は改訂済み）/ タスク2（#112）

## 使い方

新しいセッションで、次の1行を投げる。

> `docs/migration-task-kickoff.md` を読んで、issue #113（タスク3）の対応を開始してください。

以降はこの文書が作業の前提を供給する。タスクごとに指示を書き直さなくてよい。

---

## 0. 最初に読むもの

| 対象 | 目的 |
|---|---|
| 該当 issue の本文 | やることのチェックリストと完了条件。**これが仕様の入口** |
| 該当 issue のコメント | 前のタスクから持ち越された未決事項が書かれていることがある。**本文だけ読んで着手しない** |
| [migration-plan §2 の該当タスク](./migration-plan-concept-model.md) | スコープ・既存への影響・検証手順 |
| `docs/design-v2.md` の該当節（§11 の表を参照） | スキーマ・API・ステータスの正 |
| `CLAUDE.md` | 実装規約（レイヤー・命名・import・TDD・コミット規則） |

`design-v1.md` / `v1.1` / `v1.2` は履歴であり、参照しない（タスク7 で supersede 注記を入れる対象）。

**design-v2 は 2000 行超ある。全文を読まず、§11 の表が指す節だけを読むこと。**

---

## 1. 実行体制（context を節約する）

- **判断は自分で持つ**: PR の分割、契約型の設計、diff のレビュー、PR 本文、レビュー対応
- **機械的な作業はサブエージェント（Sonnet）に出す**: ファイルの書き換え、テストの移植、
  lint / typecheck / test の実行

サブエージェントには必ずこう指示する。

> 変更したファイルの一覧と、各チェックコマンドの結果（pass/fail と件数）だけを返してください。
> diff・ファイル全文・テストの出力は貼らないでください。失敗した場合はエラーの要旨のみ。

これをやらないと、サブエージェントの報告で親の context が埋まって節約の意味が無くなる。

---

## 2. 環境の準備（毎回・作業前に必ず）

```bash
service postgresql start                                   # 要 dangerouslyDisableSandbox: true
pg_isready
pnpm install --frozen-lockfile
pnpm --filter @taku-biyori/shared build
pnpm --filter @taku-biyori/backend db:test:setup            # テスト DB の作成 + マイグレーション
```

### 落とし穴（両方とも実際に踏んでいる）

- **コンテナがアイドルすると Postgres が停止する。** backend のテストが
  `relation "auth.user" does not exist` やフックのタイムアウトで大量に落ちたら、
  コードではなく**環境**を疑う。`pg_isready` → 起動し直せば直る
- **`shared` を変更したら必ず `build` する。** `packages/shared/dist/` が古いままだと
  backend / frontend の型チェックが**偽陽性で落ちる**。ブランチを切り替えた直後も同様
  （CI は毎回 shared をビルドするので CI では起きない＝ローカルだけの罠）

---

## 3. ブランチとスタック

- **ベースの決め方**: 直前のタスクの最後の PR がマージ済みなら `develop/v0.3`、
  未マージならその PR のブランチ
- **命名**: `claude/issue-<番号>-<層>`（例: `claude/issue-113-shared` / `-backend` / `-frontend`）
- **`main` には絶対に触らない。** Vercel の本番デプロイが走る。タスク2〜5 の間は特に
  （その期間は機能が一時的に欠けている）
- **スタックが3段を超えたら、先に進まずユーザーにマージを依頼する。**
  下段を1回直すたびに上段全部へマージフォワードが要るので、深いスタックは事故る
- 下段を直した場合は **merge** で上段へ流す（他人のブランチを rebase / force-push しない）

---

## 4. PR の分割

- **1本あたり 500 行程度が上限**（移行計画 §1-2）。超えるなら分割を見直す
- **タスク3〜7 は追加なので `shared` → `backend` → `frontend` の順**
  （タスク2 は削除だったため逆順だった。順序は「消す側は下流から、作る側は上流から」）
- **各 PR は単体でビルドとテストが緑であること。** 緑にできない分割は、分割の切り方が間違っている
- shared の型を**変更・削除**すると、それを使う backend / frontend が同時に壊れる。
  壊れる範囲は同じ PR に入れざるを得ない（タスク2 の #124 が前例: enum の 1 値を消すために
  frontend 13 ファイルが同乗した）。`.optional()` な**追加**なら分けられる
- **分割案が決まったら、実装に入る前にユーザーに提示して合意を取る**

---

## 5. 実装のルール（CLAUDE.md の再掲＋移行固有）

- **backend は TDD。** テストを書き、Red を確認してから実装する
- **契約型は実装より先に `shared` へ**。定義したら `src/index.ts` の barrel も更新
- **リポジトリ層はファイルごと置き換える。** メソッドを1つずつ改名する差分編集はしない
  （交差型が巨大で型エラーが増殖する。移行計画 §5 のリスク表）
- **frontend は DTO と model を分ける**（issue #113 以降の規約）。
  `@taku-biyori/shared` の型は通信契約であって FE の内部構造ではない。
  `src/api/*.ts` の中で model に変換し、composable / component は DTO を見ない
- 相対 import 禁止。`@/` を使う
- 新しいテーブル・enum は `pgSchema('{機能名}')` 経由（ADR 0005）
- DDL を変えたら `db:generate` → `db:migrate`。**`db:generate` の差分が出ないことまで確認する**

---

## 6. コミット前チェック（全部通してからコミット）

```bash
pnpm --filter @taku-biyori/shared build

pnpm --filter @taku-biyori/shared format
pnpm --filter @taku-biyori/backend format
pnpm --filter @taku-biyori/frontend format

pnpm --filter @taku-biyori/shared lint:check
pnpm --filter @taku-biyori/backend lint:check
pnpm --filter @taku-biyori/frontend lint:check

pnpm --filter @taku-biyori/shared typecheck
pnpm --filter @taku-biyori/backend typecheck
pnpm --filter @taku-biyori/frontend type-check

pnpm --filter @taku-biyori/shared test
pnpm --filter @taku-biyori/backend test
pnpm --filter @taku-biyori/frontend test
```

その PR が触ったパッケージだけでよい。ただし **shared を触ったら3つ全部**走らせる。

> `shared` の test は CI で走っていない（#100）。ローカルで必ず実行すること。

---

## 7. コミット

```bash
git -c "user.name=Claude Code Bot" -c "user.email=claude-code-bot@example.com" commit -m "..."
```

- **git config は変更しない**
- メッセージは日本語。プレフィックスは `[add]` `[update]` `[fix]` `[delete]` `[clean]` `[style]` `[doc]`
- **粒度は細かく。**「shared に型追加」「application 層実装」「route 登録」を1コミットに混ぜない

---

## 8. PR

**PR は作業がまとまった時点で作ってよい。都度の確認は不要。**
ただし**マージと approve はしない**（タスク間の直列依存を切る判断はユーザーのもの）。

タイトルは日本語＋プレフィックス。本文には次を入れる。

- 背景・目的（なぜこの変更が要るか）
- **マージ順序**（スタックしている場合はベースがどの PR かを冒頭に明記）
- 追加・廃止したエンドポイントの表
- レイヤー別の変更概要（shared / application / infrastructure / presentation / frontend）
- 権限・バリデーション・エラーハンドリングの方針
- DDL の内容（SQL を貼る）
- 検証結果（typecheck / lint / format / test の件数、実 DB での確認内容）

作成したら **PR をウォッチする（`subscribe_pr_activity`）**。CI とレビューコメントを拾い、マージ / クローズまで面倒を見る。

---

## 9. CodeRabbit の運用

- **ベースが `develop/v0.3` 以外だと自動レビューが走らない。** `@coderabbitai review` を手動で投稿する
- **無料枠は1時間1レビュー。複数の PR を一度にトリガしない。1本ずつ、順番に**
  （まとめて投げるとレート制限で無レビューの PR が残る）
- 1レビューあたり 100 ファイルが上限。§4 の 500 行ルールを守っていれば当たらない
- GitHub へのコメントは必ず末尾に attribution footer を付ける

---

## 10. やらないこと

- PR のマージ / approve
- `main` へのマージ
- テストの skip・disable・quarantine で緑にする
- 空コミットや close→reopen で CI を蹴る
- コミットメッセージ・PR 本文・コードコメントにモデル名を書く
- 指定されたブランチ以外への push（許可を取ってから）

---

## 11. タスク別メモ

| タスク | issue | 読む design-v2 の節 | PR 分割の目安 | 特に注意 |
|---|---|---|---|---|
| 3 Lobby / LobbyEntry | #113 | §3-2 §3-3 §4-1 §4-5 §6-2 §6-3 | 4本（shared / backend / frontend models+api / frontend UI） | 脱退のソフト化。**参加者一覧・回答表・着席候補のクエリを `left_at IS NULL` で絞る**（漏れやすい）。`lobby-repository.ts` はファイルごと置換。`getLobbyStatus()` を backend → shared へ移設 |
| 4 SchedulePoll | #114 | §3-4 §3-5 §3-6 §6-4 §9-9 | 3本（shared / backend / frontend） | 「最新の poll」の判定は `created_at DESC, id DESC` で決定的に。最新以外への書き込みは 409。ロジックの大半は既存の候補日ユースケースの移植（`poll_id` が1階層挟まる＋`memberId` → `entryId`）。**候補日の過去日を許すかの決定が持ち越されている**（issue のコメント参照） |
| 5 GameSession / Seat | #115 | §3-7 §3-8 §4-2 §5-2 §5-4 §5-5 §6-5 §6-6 §9-3 | 4本（shared / backend セッション / backend 着席 / frontend） | **新モデルが初めて通しで動く回。タスク2 で失った機能がここで復活する。** `seats.lobby_entry_id` のロビーと `game_sessions.lobby_id` の不一致は 422。作成時のロック（`FOR UPDATE` + `FOR KEY SHARE`）を実 DB のテストで検証。表示値の導出（未設定ならロビー参照）を DB にコピーしない |
| 6 CharacterAssignment / PlayMemo | #116 | §3-9 §3-10 §6-7 §6-15 §9-4 | 3本（shared / backend / frontend） | **プレイメモ4本はレスポンス形が不変契約**（移行の等価性の基準点）。既存31ケースを紐付け先だけ変えて 1:1 で移植する。ゲストがメモを持てないことを構造的に排除 |
| 7 横断 UI・語彙・docs | #117 | §2-2 §7-1 §7-5 | 2〜3本（ルート入れ子化 / 語彙置換 / docs） | 画面ルートを `/lobbies/:lobbyId/game-sessions/:id/*` へ入れ子化。**旧パスからのリダイレクトは作らない**。完了条件の grep（`募集枠` `卓確定` `confirmed` `closedAt` `lobbyMemberId` `dateNote` `availability` `game_session_members`）を0件にする |

---

## 12. 完了時の報告

- 作成した PR の番号と**マージ順序**
- 各 PR の検証結果（typecheck / lint / format / test の件数）
- **issue の完了条件のうち、満たせていないものを明示する**

最後の項目は必ず何か残る。各タスクの「検証」は手動の UI 操作（例: 作成 → 公開 → 招待リンク →
ゲスト参加 → 脱退 → 再参加 → 受付を閉じる → 解散 が UI から通る）であり、これは自分では確認できない。
**「全部終わりました」と書かず、人間の確認が要る項目を列挙して渡すこと。**
