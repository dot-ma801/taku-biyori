---
root: false
targets:
  - '*'
description: 'backend / shared パッケージの層構成・DB・テスト規約'
globs:
  - 'packages/backend/**'
  - 'packages/shared/**'
---
# backend / shared の規約

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

依存の向きは **内側の層に向かう**（`presentation` → `application` → `domain`）。
`infrastructure` は外側から注入する。実装例は `health/` が参考になる。

---

## `shared` パッケージとの連携

`packages/shared`（`@taku-biyori/shared`）はフロントエンドとバックエンド共通の型・契約を置く場所。

**API を実装する前に、必ず `shared` にリクエスト型・レスポンス型を定義してから始めること。**
型定義が契約となり、FE と BE の整合性を保証する。定義したら `packages/shared` の
エクスポートへの追加も忘れずに。

`shared` を変更したら `pnpm --filter @taku-biyori/shared build` を実行する
（`dist/` がないと backend のテストが型解決に失敗する）。

---

## テスト方針

**backend の実装は TDD で進めること。** 必ずテストを先に書き、失敗を確認してから実装する
（Red → Green → Refactor）。

t-wada の **AAA パターン**を採用している。

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
- **リポジトリ層（`infrastructure/`）は実 DB に対してテストする**
  （`docs/adr/0009-repository-tests-against-real-database.md`）。
  drizzle のメソッドチェーンをモックしない。接続先は `TEST_DATABASE_URL` で切り替え、
  各ケースはトランザクションでロールバックする

```bash
pnpm --filter @taku-biyori/backend db:test:setup   # テスト DB 作成 + マイグレーション（初回・スキーマ変更後）
pnpm --filter @taku-biyori/backend test:unit
pnpm --filter @taku-biyori/backend test:integration
```

> インテグレーションテストが `relation "auth.user" does not exist` やフックのタイムアウトで
> まとめて落ちたら、コードではなく **PostgreSQL が止まっていないか**を先に疑う（`pg_isready`）。

> `pnpm --filter @taku-biyori/backend test` はローカルでは watch モードで起動する。
> 1 回だけ実行したいときは `pnpm check`（`CI=true` で実行する）か `test -- run` を使う。

---

## 作業の入口

| やること | 使うスキル |
|---|---|
| 新しい API エンドポイントを追加する | `add-api-endpoint` |
| DB のテーブル・カラム・enum を変更する | `db-schema-change` |
