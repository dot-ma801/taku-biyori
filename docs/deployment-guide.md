# デプロイ手順ガイド

本番環境の構成と、デプロイ・DB マイグレーションの運用手順をまとめる。

- ワークフローの詳細設計: [`ci-migration-automation.md`](./ci-migration-automation.md)
- 方式選定の意思決定記録: [ADR 0008](./adr/0008-production-migration-in-github-actions.md) /
  [ADR 0007](./adr/0007-hono-vercel-build-output-api.md)
- ローカル開発環境のセットアップ: リポジトリルートの `README.md`

> **Status**: 本ガイドの「通常運用」は issue #90 の設計フェーズで決めた運用を記述している。
> ワークフロー（`.github/workflows/deploy-production.yml`）の実装は設計レビュー完了後に行うため、
> **実装が入るまでは §5 の緊急時手順が現行の運用**である。

---

## 目次

1. [本番環境の構成](#1-本番環境の構成)
2. [通常運用のデプロイフロー](#2-通常運用のデプロイフロー)
3. [環境変数と Secrets](#3-環境変数と-secrets)
4. [マイグレーションの書き方（前進のみの運用）](#4-マイグレーションの書き方前進のみの運用)
5. [緊急時の手順](#5-緊急時の手順)
6. [トラブルシューティング](#6-トラブルシューティング)

---

## 1. 本番環境の構成

| レイヤー | サービス | 補足 |
|---|---|---|
| DB | Neon（PostgreSQL） | 機能ごとに PostgreSQL スキーマを分離（[ADR 0005](./adr/0005-postgresql-schema-per-feature.md)） |
| backend | Vercel プロジェクト（`packages/backend`） | Hono を Build Output API v3 で serverless function 化（[ADR 0007](./adr/0007-hono-vercel-build-output-api.md)） |
| frontend | Vercel プロジェクト（`packages/frontend`） | Vue SPA。`/api/*` を backend へ rewrite |

**frontend と backend は別の Vercel プロジェクト**である。1 つのモノレポから 2 プロジェクトを
デプロイするため、各パッケージ配下に `vercel.json` を置き、Root Directory をそのパッケージに設定している。

```jsonc
// packages/backend/vercel.json
{
  "installCommand": "cd ../.. && pnpm install --frozen-lockfile",
  "buildCommand": "cd ../.. && pnpm --filter @taku-biyori/shared build && pnpm --filter @taku-biyori/backend build:vercel"
  // outputDirectory は指定しない。指定すると静的配信扱いになり Build Output API として機能しない（ADR 0007）
}
```

```jsonc
// packages/frontend/vercel.json
{
  "installCommand": "cd ../.. && pnpm install --frozen-lockfile",
  "buildCommand": "cd ../.. && pnpm --filter @taku-biyori/shared build && pnpm --filter @taku-biyori/frontend build",
  "outputDirectory": "dist",
  "rewrites": [
    { "source": "/api/:path*", "destination": "https://taku-biyori-backend.vercel.app/api/:path*" },
    { "source": "/(.*)", "destination": "/index.html" }
  ]
}
```

frontend は **実行時に** rewrite 経由で backend を叩く。ビルド時の依存はない。
そのため「API 契約を変える変更」では backend を先にデプロイする必要がある。

---

## 2. 通常運用のデプロイフロー

**main へ merge するだけでよい。手動操作は不要。**

```
main へ merge
  → CI（lint / format / typecheck / test / build）
      → migrate（DB 変更がある場合のみ。Neon 本番）
          → backend デプロイ
              → frontend デプロイ
                  → production-deployed タグ更新

いずれかが失敗したら、以降はすべて実行されない
```

- 起動は GitHub Actions の `Deploy Production` ワークフロー。CI の成功を `workflow_run` で待つ
- Vercel の Git 連携による**本番デプロイは無効化**されている
  （`vercel.json` の `git.deploymentEnabled`）。本番デプロイは Actions からのみ行われる
- **PR の preview デプロイは従来どおり動く**。レビュー時の確認手段は変わらない
- 実行履歴は Actions のログに残る。「いま本番に入っている SHA」は
  `production-deployed` タグで確認できる

```bash
# 本番に入っているコミットを確認する
git fetch --tags
git log -1 production-deployed
```

### migrate がスキップされる条件

`production-deployed` タグ以降で `packages/backend/drizzle/` に変更が無い場合、
`migrate` ジョブは skip され deploy のみが走る。DB 変更が無いリリースで本番 DB に接続しないため。

判定できない場合（タグ未作成、差分取得の失敗）は**必ず migrate を実行する**。
誤ってスキップするのは危険だが、余分に実行するのは `drizzle-kit migrate` が冪等なので無害。

### 手動でデプロイをやり直す

Actions の `Deploy Production` → `Run workflow` から実行する。
`ref` に SHA を入れると、そのコミットをデプロイできる（省略時はブランチの最新）。

---

## 3. 環境変数と Secrets

管理場所が 2 つあり、**役割が違う**。

### 3.1 Vercel プロジェクトの環境変数（アプリ実行時）

アプリが実行時に読む値。変数名の一覧は `CLAUDE.md` の環境変数表を参照。
`DATABASE_URL` / `BETTER_AUTH_SECRET` などが含まれる。

**本番 `DATABASE_URL` はここが単一ソースである。** GitHub Secrets には登録しない。
CI の migrate ジョブも `vercel pull` でここから取得する。
資格情報をローテーションするときは **Vercel 側だけを更新すればよい**。

### 3.2 GitHub Environment `production` の secrets（CI 実行時）

Actions が Vercel を操作するための資格情報のみ。
repository secrets ではなく **environment secrets** に置く
（`ci.yml` は `environment:` を宣言しないため、構造的にアクセスできない）。

| Secret 名 | 用途 |
|---|---|
| `VERCEL_TOKEN` | Vercel CLI 認証（migrate / backend / frontend 共通） |
| `VERCEL_ORG_ID` | Vercel チーム / 個人アカウント ID（共通） |
| `VERCEL_BACKEND_PROJECT_ID` | backend プロジェクト ID |
| `VERCEL_FRONTEND_PROJECT_ID` | frontend プロジェクト ID |

> **本番 `DATABASE_URL` をここに追加しないこと。** Vercel と GitHub の 2 箇所管理になり、
> ローテーション時の更新漏れで migrate だけが古い資格情報で落ちる。

---

## 4. マイグレーションの書き方（前進のみの運用）

**ロールバックの自動化は行っていない。Drizzle は前進のみを前提とする。**

さらに重要な制約として、**migrate は backend デプロイより先に走る**。
つまり「**旧 backend が動いている状態で新スキーマが適用される瞬間**」が必ず存在する。

→ **後方互換（additive）なマイグレーションを原則とする。**

### 安全な変更

- カラムの追加（nullable、またはデフォルト値付き）
- テーブルの追加
- インデックスの追加

### 2 段リリースに分ける変更（expand → contract）

カラム削除・`SET NOT NULL`・リネーム・型変更は、1 回のリリースでやってはいけない。

| | リリース 1（expand） | リリース 2（contract） |
|---|---|---|
| カラム削除 | コードから参照を消す | カラムを `DROP` する |
| `SET NOT NULL` | nullable のまま追加し、コードで必ず値を入れる／既存行を埋める | `SET NOT NULL` を付ける |
| リネーム | 新カラムを追加し、両方に書く | 旧カラムを `DROP` する |

> 既存のマイグレーション履歴（`0000`〜`0013`）には `DROP TABLE` × 2 / `DROP COLUMN` × 1 /
> `SET NOT NULL` × 1 が含まれている。手動運用では実行タイミングを人間が握れていたが、
> **自動化後は同じ書き方が本番で危険**になる。

### レビュー

`drizzle-kit generate` が生成した SQL は必ず commit し、**PR で SQL 差分をレビューする**。
`DROP` / `SET NOT NULL` / 型変更を含む PR では、expand → contract のどちらの段なのかを説明する。

### 破壊的変更を含むリリースの前に

Neon のブランチ機能で本番のスナップショットを取っておく（Neon コンソール → Branches → New branch）。
切り戻しが必要になったときの復旧元になる。自動化はしていない。

### トランザクションについて

`drizzle-kit migrate` はマイグレーションファイル単位でトランザクションを張る。
現行の `0000`〜`0013` に `CREATE INDEX CONCURRENTLY` 等トランザクション内で実行できない文は
含まれていないため、失敗時に部分適用状態になることはない。
将来そうした文を導入する場合は、失敗時に部分適用されうるため個別に慎重にレビューする。

---

## 5. 緊急時の手順

> ⚠️ **通常運用では使用しないこと。** Actions 経由の履歴が残らず、順序保証も働かない。
> GitHub Actions または Vercel の障害で通常フローが使えない場合のみ使う。
> **実行したら、いつ・誰が・何を実行したかを issue か PR に必ず記録する。**

### 5.1 ローカルから本番マイグレーションを実行する

```bash
# 接続文字列は Vercel の本番環境変数から取得する（コマンド履歴やファイルに残さないこと）
DATABASE_URL="postgresql://..." pnpm --filter @taku-biyori/backend db:migrate
```

注意点:

- **`.env` に本番の値を書かないこと。** その場限りの環境変数として渡す
- Neon の pooled 接続（ホスト名に `-pooler` を含む）ではなく **unpooled の接続文字列**を使う
- 実行後、`packages/backend/drizzle/meta/_journal.json` の件数と実際の適用状況が
  一致していることを確認する

### 5.2 ローカルから本番デプロイを実行する

```bash
# backend → frontend の順序を守る
vercel deploy --prod --token="$VERCEL_TOKEN" --cwd packages/backend
vercel deploy --prod --token="$VERCEL_TOKEN" --cwd packages/frontend
```

`VERCEL_ORG_ID` / `VERCEL_PROJECT_ID` を環境変数で渡すか、事前に `vercel link` しておく必要がある。

### 5.3 復旧後にやること

緊急対応で本番に手を入れた場合、`production-deployed` タグが実態とズレる。
次回の通常デプロイで migrate が再実行されるが、`drizzle-kit migrate` は冪等なので無害。
気になる場合はタグを手で合わせる。

```bash
git tag -f production-deployed <本番に入っている SHA>
git push -f origin refs/tags/production-deployed
```

---

## 6. トラブルシューティング

| 症状 | 確認すること |
|---|---|
| main へ merge しても `Deploy Production` が起動しない | CI が成功しているか。`workflow_run` はワークフロー定義が default branch に無いと発火しない |
| `Deploy Production` が全ジョブ skip で終わる | `guard` の条件（CI の `conclusion` / `head_branch` / `event`）を Actions のログで確認する |
| migrate が `DATABASE_URL not found` で落ちる | Vercel の本番環境変数に `DATABASE_URL` があるか。`vercel pull` が成功しているか |
| migrate が接続エラー・DDL エラーで落ちる | pooled 接続を使っていないか。`DATABASE_URL_UNPOOLED` があればそちらが使われる |
| Vercel に Git push 由来のデプロイが作られてしまう | `vercel.json` の `git.deploymentEnabled` が反映されているか。反映されない場合は Ignored Build Step で代替する |
| backend は新しいのに frontend が古い | `deploy-frontend` が失敗していないか。`production-deployed` タグは全成功時のみ進む |
| PR の preview デプロイが動かなくなった | `git.deploymentEnabled` で main 以外までブロックしていないか |
