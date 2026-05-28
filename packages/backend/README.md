# Backend

`packages/backend` は、Hono と Better Auth、Drizzle ORM を使ったバックエンドです。

このパッケージでは、依存を外側に寄せてテストしやすい構成にしています。

## 起動方法

```bash
pnpm install
pnpm --filter @app-template/backend dev
```

起動後は次の URL で確認できます。

- `http://localhost:3000`

## 環境変数

必須の環境変数は次のとおりです。

- `DATABASE_URL`
- `BETTER_AUTH_SECRET`

任意の環境変数は次のとおりです。

- `PORT` - 既定値は `3000`
- `FRONTEND_URL` - 既定値は `http://localhost:5173`
- `BETTER_AUTH_URL` - 既定値は `http://localhost:3000`
- `GOOGLE_CLIENT_ID`
- `GOOGLE_CLIENT_SECRET`

## スクリプト

`packages/backend/package.json` には、主に次のスクリプトがあります。

- `pnpm --filter @app-template/backend dev`
- `pnpm --filter @app-template/backend build`
- `pnpm --filter @app-template/backend start`
- `pnpm --filter @app-template/backend test`
- `pnpm --filter @app-template/backend test:unit`
- `pnpm --filter @app-template/backend test:integration`
- `pnpm --filter @app-template/backend db:generate`
- `pnpm --filter @app-template/backend db:migrate`
- `pnpm --filter @app-template/backend db:push`
- `pnpm --filter @app-template/backend db:studio`

## アーキテクチャ

backend は、テストしやすさを優先して次のように分けています。

- `domain` - 純粋なルールや値オブジェクト
- `application` - ユースケース
- `infrastructure` - DB、環境変数、外部サービス連携
- `presentation` - HTTP ルートとアプリケーション組み立て

依存の向きは、内側の層に向かうようにしています。

## `shared` との連携

`packages/shared` には、frontend と backend で共通に使う契約を置いています。

backend 側では、たとえば次を共有しています。

- 疎通確認レスポンス
- Better Auth のセッションレスポンス
- ユーザー型

これにより、フロントエンドとバックエンドでレスポンス形状の解釈がずれにくくなります。

## テスト

backend のテストでは、t-wada の AAA パターンを採用しています。

- Arrange
- Act
- Assert

ユースケースは純粋関数寄りにして、HTTP 層は注入した依存を使って検証しやすくしています。

## 命名規則

この backend では、機能ごとのファイル名を `kebab-case` に寄せています。

理由は次のとおりです。

- 複数単語の役割が読み取りやすい
- import パスを見たときに責務がすぐ分かる
- `create-auth` や `health-route` のような用途名と相性がよい

今後も backend 内では、この方針を基本に揃えます。
