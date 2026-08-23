# Backend

`packages/backend` は、Hono と Better Auth、Drizzle ORM を使ったバックエンドです。

このパッケージでは、依存を外側に寄せてテストしやすい構成にしています。

## 起動方法

```bash
pnpm install
pnpm --filter @taku-biyori/backend dev
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
- `TEST_DATABASE_URL` - リポジトリ層のテストが接続する実 DB。未設定だとリポジトリ層のテストが失敗する

## スクリプト

`packages/backend/package.json` には、主に次のスクリプトがあります。

- `pnpm --filter @taku-biyori/backend dev`
- `pnpm --filter @taku-biyori/backend build`
- `pnpm --filter @taku-biyori/backend start`
- `pnpm --filter @taku-biyori/backend test`
- `pnpm --filter @taku-biyori/backend test:unit`
- `pnpm --filter @taku-biyori/backend test:integration`
- `pnpm --filter @taku-biyori/backend db:generate`
- `pnpm --filter @taku-biyori/backend db:migrate`
- `pnpm --filter @taku-biyori/backend db:push`
- `pnpm --filter @taku-biyori/backend db:studio`
- `pnpm --filter @taku-biyori/backend db:seed`
- `pnpm --filter @taku-biyori/backend db:test:setup`

### `db:seed`

開発用データ（ユーザー4人・ロビー3件・参加者・候補日と◯△×回答・卓3件・卓メンバー・
プレイメモ）を1コマンドで作り直します。破壊的なマイグレーションの直後に、
手作業なしで開発環境を復元するためのものです。

> **本番環境では実行しないこと。**
> 既存のシードデータを削除してから作り直すため、本番の DB に向けて実行するとデータが失われます。
> マイグレーション（DDL・履歴管理あり・本番でも実行する）とは別物で、
> シードは DML・履歴管理なし・開発環境専用です。`NODE_ENV=production` では起動時に失敗します。

シードで作ったユーザーはユーザー名（`yuki` / `haru` / `natsu` / `aki`）と
パスワードでログインできます。公開中のロビー・卓は誰の一覧にも出るため、
Google ログインの開発アカウントからも確認できます。

何度実行しても同じ状態になります（前回のシードデータだけを消してから作り直すため、
手で作った開発データは残ります）。

### `db:test:setup`

`TEST_DATABASE_URL` が指すテスト用データベースを、無ければ作成してから
マイグレーションを適用します。ローカルと CI のどちらでも同じコマンドで初期化できます。

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

### リポジトリ層は実 DB に対してテストする

`test/integration/` に置いたリポジトリ層のテストは、`TEST_DATABASE_URL` が指す
実データベースに対して実行します。drizzle のメソッドチェーンをモックして
生成 SQL 文字列を検証する形式では、クエリが実際に正しい結果を返すかを確認できないためです。

初回は次を実行してテスト用 DB を用意します。

```bash
pnpm --filter @taku-biyori/backend db:test:setup
```

テスト間の分離は、各テストをトランザクションで包んでロールバックする方式です
（`test/helpers/test-database.ts` の `withRollback`）。TRUNCATE が不要なぶん速く、
テストが並行に走っても互いの未コミットデータは見えません。

例外は `test/integration/row-lock-contention.test.ts` で、`SELECT ... FOR UPDATE` の
競合は同一トランザクション内では再現できないため、実際にコミットしてから後片付けします。

`test:unit` は DB を必要としません。DB が要るのは `test:integration` の一部だけです。

## 命名規則

この backend では、機能ごとのファイル名を `kebab-case` に寄せています。

理由は次のとおりです。

- 複数単語の役割が読み取りやすい
- import パスを見たときに責務がすぐ分かる
- `create-auth` や `health-route` のような用途名と相性がよい

今後も backend 内では、この方針を基本に揃えます。
