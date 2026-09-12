---
root: true
targets:
  - '*'
globs:
  - '**/*'
---
# taku-biyori（RollHub）

TRPG の「卓」を立てて日程調整し、当日の記録を残す Web アプリ。
pnpm workspace のモノレポで、`packages/` 配下に `shared` / `backend` / `frontend` がある。

> **このファイルは生成物です。** 実体は `.rulesync/rules/` にあります。
> `CLAUDE.md` / `AGENTS.md` / `.claude/` を直接編集しても `rulesync generate` で上書きされます。
> ルールを変えるときは `.rulesync/rules/*.md` を編集し、`pnpm rules:sync` を実行してください。

パッケージ固有の規約は、そのパッケージのファイルを触ったときに読み込まれます。

| 対象 | ルール |
|---|---|
| `packages/backend/**` `packages/shared/**` | `.claude/rules/backend.md` |
| `packages/frontend/**` | `.claude/rules/frontend.md` |

---

## 設計ドキュメント

現行仕様は **[`docs/design/v0.3/design-concept-model.md`](docs/design/v0.3/design-concept-model.md)** が唯一の根拠。
**API を実装・変更する前に必ず参照すること。** 一覧は [`docs/design/README.md`](docs/design/README.md)。

`docs/design/v0.1/` `v0.2/` は **superseded**（履歴）。実装の根拠には使わない。

### コード中の `design-v2 §…` の読み方

これは**ファイル名ではなく設計書の通称**。ファイルを `docs/design/v{版}/` へ再編したあとも語彙だけ残っている。

| コード中の表記 | 指す文書 |
|---|---|
| `design-v2 §…` | `docs/design/v0.3/design-concept-model.md`（現行） |
| `design-v1.2 §…` | `docs/design/v0.2/design-play-memo.md` |
| `design-v1.1 §…` / `design-v1 §…` | `docs/design/v0.1/` の各文書 |

`design-v1.x §…` は **v2 が引き継いだ判断の出典を示す履歴参照**。仕様の確認は必ず v0.3 で行う。
唯一の例外はプレイメモ4本で、design-v2 §6-15 が「リクエスト・レスポンス契約を v2 でも変えない」と
明示しているため、v1.2 §4（操作可否）・§5（エラー表）・§8 は挙動の記録として有効
（パスの入れ子化と `memberId` → `seatId` の改名を除く）。

---

## インポートルール

`src/` および `test/` 配下で**相対パス（`./`・`../`）のインポートは禁止**。必ず `@/` エイリアスを使う
（ESLint `no-restricted-imports` で強制。backend・frontend 共通）。

```ts
import { foo } from '../../../src/game-session/domain/foo'; // ❌
import { foo } from '@/game-session/domain/foo'; // ✅
```

`@/` は各パッケージの `src/` を指す（`tsconfig.json` の `paths` と `vite.config.ts` の `resolve.alias`）。

---

## 命名規則

- ファイル名は **kebab-case**（`create-game-session.ts`）
  - **例外: Vue の SFC（`.vue`）とそのディレクトリは PascalCase**（`PublicLobbyList.vue`,
    `components/common/BaseBreadcrumb/`）。ルートに対応するエントリポイントだけ `index.vue`
- 開催（セッション）の識別子はすべて **`game` プレフィックス**（`gameSession` / `GameSession`）
  - Better Auth の `session` と衝突するため
- DB カラム名は **スネークケース**（`host_user_id`, `scheduled_at`）

---

## 日本語ラベル（design-v2 §2-2 / issue #147）

**方針: BE では概念を分ける。UI ではそれを漏らさない。**

Lobby と GameSession は**バックエンドでは別リソース・別ステータスのまま**だが、
**利用者に見せる名詞は「卓」1つ**に統一する。UI 表示層で2つを1つの卓に畳む場所は
`features/GameSession/` に集約してある。

| 概念 | UI 表記 |
|---|---|
| Lobby + GameSession（1つの企画） | 卓 |
| LobbyEntry | 参加 / 参加者 / メンバー |
| SchedulePoll | 日程調整 |
| Seat | 着席 / 当日の参加者 |

卓の状態は次の1系列だけを見せる。**固定語彙なのでそのまま使うこと**
（定義は `features/GameSession/gameSessionCardStatus.ts`）。

```
募集中 → 調整中 → 開催予定 → 完了 / 中止
```

「下書き」はこの系列の外側で、ホストにしか見えない。

UI が「卓」1つに見せていても、**コード側（型・変数・API）の分離はそのまま維持する**。
`Lobby` / `GameSession` / `LobbyStatus`（4値）/ `GameSessionStatus`（4値）や
`disbanded_at`（解散）・`cancelled_at`（中止）は design-v2 のとおりに扱う。

`features/Landing/` のマーケティング文言の「卓」はサービス全体を語る文脈として残しているもの。
「直接卓立て」は design-v2 §5-3 / §7-3 の用語なのでそのまま。

### ドキュメントでのステータス表記

ドキュメントでステータスに言及するときは **`日本語ラベル名(変数名)`** の形で書く。

```
✅ 募集中(recruiting) から 調整中(scheduling) に遷移する
❌ recruiting から scheduling に遷移する
❌ 「募集中」から「調整中」に遷移する
```

---

## 書き方の規約

- **あらゆる出力は MECE を意識し、簡潔に書く。** 重複・漏れのない切り分けを優先し、冗長な前置きや
  言い換えは削る。これはコード・ドキュメント・PR 本文・レビュー返信・チャット応答すべてに適用する
- **コメントは基本3行以内。どんなに長くても5行**。それ以上必要ならコメントではなく設計か命名を直す
- 複雑なビジネスロジックにはコメントを残す。自明なコードには付けない
- `if` 文のブロックは単行でも必ず `{}` を付ける

---

## Git 運用

### コミット

- **メッセージは日本語**
- **粒度は細かく、その場で都度コミットする。** まとめて後でコミットすると、同じファイルに別の文脈の
  変更が混ざって切り分けられなくなる。意味のまとまりができた時点でコミットする
- 1 コミットに複数の独立した変更を混ぜない
- **プレフィックスは以下のいずれか**

| プレフィックス | 用途 |
|---|---|
| `[add]` | 新規ファイル・機能・型の追加 |
| `[update]` | 既存機能の変更・改善 |
| `[fix]` | バグ修正 |
| `[delete]` | ファイル・コード・機能の削除 |
| `[clean]` | フォーマット・lint・命名など動作に影響しない変更 |
| `[style]` | CSS・スタイリングの変更 |
| `[doc]` | ドキュメント・コメントの追加・更新 |

```
[add] shared に UpdateGameSessionInput 型を追加
[add] update-game-session ユースケースを実装
[fix] GET /api/game-sessions/:id を未認証でも公開セッションに接続できるよう修正
```

コミット時は必ず以下の形式を使う（`git config` は変更しない）。

```bash
git -c "user.name=Claude Code Bot" -c "user.email=claude-code-bot@example.com" commit -m "..."
```

### コンフリクトの解消

**必ず rebase で解消する。`git merge` は使わない。**

```bash
git fetch origin
git rebase origin/main
# 解消後
git rebase --continue
```

履歴を直線に保つため、マージコミットを作る解決方法は取らない。

### PR

- **タイトルは日本語**で簡潔に。コミット規則と同じプレフィックスを使う
  - 例: `[add] 候補日一括更新・日程回答（◯△×）API を実装`
- **本文は詳細に**。次を含める
  - 実装の背景・目的
  - 追加・変更したエンドポイントや機能の一覧
  - レイヤーごとの変更概要（shared / application / infrastructure / presentation）
  - 権限・バリデーション・エラーハンドリングの方針
  - DB スキーマ変更があればその内容

---

## コミット前チェック

```bash
pnpm check
```

shared のビルド → format → lint → typecheck → test を shared・backend・frontend の3パッケージすべてに
対して実行する。CI（`.github/workflows/ci.yml`）と同じ検証内容。`pnpm check:ci` は自動修正なしの検査のみ。

> `@taku-biyori/shared` は `dist/` がないと backend・frontend のテストが型解決に失敗する。
> `pnpm check` は先頭で shared をビルドするので、個別にコマンドを打つ場合も同じ順序を守ること。

ルールを編集したあとは生成物を更新する。

```bash
pnpm rules:sync   # .rulesync/ → CLAUDE.md / AGENTS.md / .claude/ / .codex/
pnpm rules:check  # 生成物が最新か検証（CI でも実行）
```

---

## 環境変数

| 変数名 | 必須 | 既定値 |
|---|---|---|
| `DATABASE_URL` | ✅ | — |
| `TEST_DATABASE_URL` | ✅（テスト実行時） | — |
| `BETTER_AUTH_SECRET` | ✅ | — |
| `PORT` | — | `3000` |
| `FRONTEND_URL` | — | `http://localhost:5173` |
| `BETTER_AUTH_URL` | — | `http://localhost:3000` |
| `GOOGLE_CLIENT_ID` | — | — |
| `GOOGLE_CLIENT_SECRET` | — | — |

---

## 開発サーバー

```bash
pnpm --filter @taku-biyori/backend dev   # http://localhost:3000
pnpm --filter @taku-biyori/frontend dev  # http://localhost:5173
```
