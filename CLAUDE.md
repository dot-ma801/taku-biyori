# CLAUDE.md — RollHub Backend

このファイルは Claude Code 向けの実装ガイドです。
実装を始める前に必ず読んでください。

---

## 設計ドキュメント

実装に必要な設計情報はすべて `docs/design-v*.md` にまとまっています。
**APIを実装する前に必ず参照してください。**

特に以下のセクションを確認してください。

- DBスキーマ（テーブル定義・カラム型・リレーション）
- ステータス設計（`getGameSessionStatus` の導出ロジック）
- API設計（エンドポイント一覧・方針）
- 命名規則（`gameSession` プレフィックス・スネークケース等）

---

## パッケージ構成

```
packages/backend/src/
├── {機能名}/
│   ├── domain/          # 純粋なルールや値オブジェクト
│   ├── application/     # ユースケース（純粋関数寄りに実装）
│   ├── infrastructure/  # DB・外部サービス連携
│   └── presentation/
│       └── controller/
│           └── routes/  # Hono ルート定義
├── system/
│   ├── db/              # Drizzle スキーマ・クライアント
│   └── infrastructure/  # 環境変数・DB接続
└── app/
    └── presentation/
        └── controller/
            └── create-app.ts  # アプリ組み立て
```

依存の向きは **内側の層に向かう** ように保つこと。
`presentation` → `application` → `domain` の順。`infrastructure` は外側から注入する。

既存の `health/` ディレクトリが実装例として参考になります。

---

## 技術スタック

| 用途 | ライブラリ |
|---|---|
| HTTP フレームワーク | Hono 4.x |
| 認証 | Better Auth 1.x |
| ORM | Drizzle ORM 0.45.x |
| DB ドライバ | postgres（Neon） |
| テスト | Vitest 4.x |
| ランタイム | Node.js（`@hono/node-server`） |

---

## 命名規則

- ファイル名は **kebab-case**（例: `create-game-session.ts`, `game-session-route.ts`）
- 卓（セッション）に関する識別子はすべて **`game` プレフィックス**を付ける
  - 変数名: `gameSession`
  - 型名: `GameSession`
  - 理由: Better Auth の `session` と衝突するため
- DB カラム名は **スネークケース**（例: `host_user_id`, `scheduled_at`）

---

## DB スキーマの変更手順

スキーマを変更した場合は以下を実行します。

```bash
pnpm --filter @taku-biyori/backend db:generate
pnpm --filter @taku-biyori/backend db:migrate
```

---

## テスト方針

**Backend の実装は TDD（テスト駆動開発）で進めること。**
必ずテストを先に書き、失敗を確認してから実装する。Red → Green → Refactor のサイクルを守る。

t-wada の **AAA パターン**を採用しています。

```ts
// Arrange
const input = ...

// Act
const result = ...

// Assert
expect(result).toEqual(...)
```

- ユースケース（`application/`）は純粋関数寄りに実装し、単体テストを書きやすくする
- HTTP 層（`presentation/`）は注入した依存を使って検証する
- テストは `test/unit/` と `test/integration/` に分けて配置する

```bash
# 全テスト
pnpm --filter @taku-biyori/backend test

# ユニットテストのみ
pnpm --filter @taku-biyori/backend test:unit

# インテグレーションテストのみ
pnpm --filter @taku-biyori/backend test:integration
```

---

## `shared` パッケージとの連携

`packages/shared`（`@taku-biyori/shared`）には、フロントエンドとバックエンドで共通の型・契約を置いています。

**API を実装する前に、必ず `shared` にリクエスト型・レスポンス型を定義してから始めること。**
型定義が契約となり、フロントエンドとバックエンドの整合性を保証する。
型を定義したら `packages/shared` のエクスポートに追加することも忘れずに。

---

## 環境変数

| 変数名 | 必須 | 既定値 |
|---|---|---|
| `DATABASE_URL` | ✅ | — |
| `BETTER_AUTH_SECRET` | ✅ | — |
| `PORT` | — | `3000` |
| `FRONTEND_URL` | — | `http://localhost:5173` |
| `BETTER_AUTH_URL` | — | `http://localhost:3000` |
| `GOOGLE_CLIENT_ID` | — | — |
| `GOOGLE_CLIENT_SECRET` | — | — |

---

## 新しい API を追加する手順

1. `docs/design-v*.md` でエンドポイント仕様・DBスキーマを確認する
2. **`packages/shared` にリクエスト型・レスポンス型を定義する**（実装より先に行うこと）
3. **テストを先に書く**（TDD: Red → Green → Refactor）
4. `src/{機能名}/` ディレクトリを作成し、レイヤーごとにファイルを分ける
5. `src/{機能名}/presentation/controller/routes/{機能名}-route.ts` にルートを定義する
6. `src/app/presentation/controller/create-app.ts` にルートを登録する

---

## 開発サーバーの起動

```bash
pnpm --filter @taku-biyori/backend dev
# → http://localhost:3000
```
