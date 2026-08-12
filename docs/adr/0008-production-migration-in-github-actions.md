# ADR 0008: 本番 DB マイグレーションを GitHub Actions 上で実行し、デプロイ順序を Actions 側で制御する

## Status

Proposed

## Context

本プロジェクトの本番環境は Neon（PostgreSQL）と Vercel 2 プロジェクト（`frontend` / `backend`）で構成されている。DB マイグレーションは Drizzle ORM の `drizzle-kit migrate` を使い、開発者のローカルから本番 `DATABASE_URL` を環境変数で渡して手動実行する運用になっている。

```bash
DATABASE_URL="postgresql://..." pnpm --filter @taku-biyori/backend db:migrate
```

初回セットアップの手順としては妥当だったが、継続運用フェーズに向けて破綻しはじめている。

### 解決したい課題

- **本番 `DATABASE_URL` がローカル環境に常駐する**。漏洩・誤送信・誤って別環境へ流し込むリスクが常にある
- **migrate とデプロイの順序が人手依存**。実行漏れ・順序ミスが起きうるし、起きたことに気づく仕組みもない
- **「誰がいつ本番 migrate を実行したか」の記録が残らない**。障害調査の起点が無い
- Vercel の Git 連携による自動デプロイは main への push で即座に走るため、**そもそも migrate を先に差し込む隙間が無い**

### 検討した選択肢

「CI 成功の待ち合わせ方」と「Vercel のデプロイ起動方式」の 2 軸がある。

**軸A: 新ワークフローと既存 `ci.yml` の関係**

1. **`workflow_run` で `ci.yml` の成功を待って起動する**
2. **既存 `ci.yml` に deploy ジョブを追加して `needs` で繋ぐ**
3. **`on: push: branches: [main]` で独立に走らせる**（CI 結果を見ない）

**軸B: Vercel のデプロイ起動方式**

1. **Git 連携の本番デプロイを止め、Actions から Vercel CLI で明示デプロイする**
2. **Deploy Hooks を Actions から叩く**

### 各選択肢の評価

軸A:

| 観点 | A-1. `workflow_run` | A-2. `ci.yml` へ統合 | A-3. `push: main` で独立 |
|------|--------------------|---------------------|------------------------|
| CI 成功を保証できるか | ✅ ワークフロー自身の条件で保証 | ✅ `needs` で保証 | ❌ branch protection の設定に依存 |
| CI とデプロイの責務分離 | ✅ ファイルが分かれる | ❌ 1 ファイルに混在 | ✅ 分かれる |
| ジョブ定義の重複 | ✅ なし | ✅ なし | ✅ なし |
| PR 実行時の見え方 | ✅ そもそも起動しない | ❌ deploy ジョブが常に skip 表示 | ✅ 起動しない |
| PR 上での E2E 検証 | ❌ default branch に無いと発火しない | ✅ PR で試せる | ❌ 同左 |
| 検証済み SHA との一致 | ✅ `head_sha` を明示 checkout | ✅ 同一実行なので自明 | ⚠️ CI と別実行になる |

軸B:

| 観点 | B-1. Vercel CLI | B-2. Deploy Hooks |
|------|----------------|-------------------|
| 完了待ち | ✅ CLI が同期的にブロックする | ❌ fire-and-forget。受理のみ返る |
| 失敗検知 | ✅ 非 0 終了でジョブが失敗する | ❌ 別途 Deployments API のポーリングが必要 |
| backend → frontend の順序保証 | ✅ `needs` の直列化で成立 | ❌ 完了を待てないため成立しない |
| migrate 失敗時にデプロイを止める | ✅ 成立 | ⚠️ キックしないことで止められるが、成否は見えない |
| 必要な Secrets | TOKEN + ORG_ID + PROJECT_ID × 2 | Hook URL × 2 のみ |
| ビルドログの所在 | ✅ Actions に一元化できる | ❌ Vercel 側のみ |

Deploy Hooks は設定が軽い代わりに**完了ステータスを返さない**。これは「migrate 失敗時にデプロイが行われない」「backend / frontend の順序が保証されている」という要求を**構造的に満たせない**ことを意味する。ここが決定的な差になった。

## Decision

**本番 DB マイグレーションを GitHub Actions の独立ジョブとして実行し、Vercel の Git 連携による本番デプロイを止めて Actions から Vercel CLI で明示的にデプロイする。CI の成功は `workflow_run` で待ち合わせる。**（軸A-1 + 軸B-1）

### 1. `workflow_run` で CI の成功を待つ

`ci.yml`（`name: CI`）の完了イベントを受けて `deploy-production.yml` を起動する。`on: push: branches: [main]` 単体は採用しない。テストが落ちているコードを本番 DB へ適用しうるためである。

```yaml
on:
  workflow_run:
    workflows: ['CI']
    types: [completed]
  workflow_dispatch:
    inputs:
      ref:
        description: 'デプロイ対象の commit SHA（省略時は main の最新）'
        required: false

concurrency:
  group: deploy-production
  cancel-in-progress: false
```

`ci.yml` は `pull_request` でも走るため、`conclusion == 'success'` に加えて `event == 'push'` と `head_branch == 'main'` の絞り込みが必須。この判定と対象 SHA の解決は `guard` ジョブ 1 箇所に集約し、後続は `needs: guard` で繋ぐ。

`cancel-in-progress: false` は必須である。migrate 実行中のジョブがキャンセルされると DB が中途半端な状態のまま残りうるため、キャンセルせずキューイングして 1 本ずつ完走させる。

### 2. Git 連携の本番デプロイを `vercel.json` で止める

各パッケージの `vercel.json` に宣言する。ダッシュボード設定ではなく**コードとしてレビュー可能・再現可能**にすることを優先した。

```json
{
  "git": { "deploymentEnabled": { "main": false } }
}
```

main の本番デプロイのみをブロックし、PR の preview デプロイは維持する。レビュー時の目視確認体験を変えないためである。

### 3. デプロイは `vercel pull` → `vercel build` → `vercel deploy --prebuilt`

Vercel 公式の CI 連携パターンに従い、ビルドを Actions ランナー上で行う。

```bash
vercel pull --yes --environment=production --token="$VERCEL_TOKEN" --cwd packages/backend
vercel build --prod --token="$VERCEL_TOKEN" --cwd packages/backend
vercel deploy --prebuilt --prod --token="$VERCEL_TOKEN" --cwd packages/backend
```

`vercel build` は既存 `vercel.json` の `installCommand` / `buildCommand` をそのまま実行するため、ADR 0007 で決めた Build Output API 方式が唯一の正として維持される。`vercel deploy --prebuilt` は生成済みの `.vercel/output` をアップロードするだけなので、**CLI の終了＝デプロイ完了**が曖昧さなく成立する。

### 4. 本番 `DATABASE_URL` は Vercel を単一ソースにする

**GitHub Secrets には本番 `DATABASE_URL` を置かない。** backend の runtime 用 `DATABASE_URL` は Vercel プロジェクトの env に必ず存在するため、GitHub Secrets にも同じ値を置くと資格情報ローテーション時に 2 箇所の更新が必要になり、片方の更新漏れで migrate だけが古い資格情報で落ちる事故が起きうる。

migrate ジョブも `vercel pull` で本番 env を取得し、そこから `DATABASE_URL` のみを抽出して使う。

```yaml
- name: Resolve DATABASE_URL
  run: |
    url=$(grep -m1 '^DATABASE_URL=' packages/backend/.vercel/.env.production.local | cut -d= -f2- | tr -d '"')
    test -n "$url" || { echo 'DATABASE_URL not found in pulled env'; exit 1; }
    echo "::add-mask::$url"
    echo "DATABASE_URL=$url" >> "$GITHUB_ENV"
```

`.env.production.local` を丸ごと `source` せず `DATABASE_URL` のみを取り出す（`BETTER_AUTH_SECRET` 等は migrate に不要なため env へ載せない）。GitHub Environments `production` に置く secrets は Vercel 関連の 4 つのみとなる。

### 5. migrate 失敗時はジョブ間 `needs` でデプロイを止める

`guard` → `migrate` → `deploy-backend` → `deploy-frontend` → `mark-deployed` を `needs` で直列化する。GitHub Actions のジョブは `if` を明示しない場合デフォルトで `success()` と等価に評価されるため、`migrate` が失敗すれば後続は自動的に skip される。`continue-on-error` と `if: always()` はデプロイジョブに一切付けない。

### 6. DB 変更が無ければ migrate をスキップする

`production-deployed` タグ（デプロイ成功時に更新する軽量タグ）との差分で `packages/backend/drizzle/` の変更を検出し、変更が無ければ `migrate` ジョブを skip して deploy のみを走らせる。

判定できない場合（タグ未作成の初回、`git diff` 失敗）は**必ず migrate を実行する**。誤ってスキップするのは危険だが、余分に実行するのは `drizzle-kit migrate` が冪等なので無害という非対称性に従う。

`HEAD^` との比較は採用しない。1 回の push に複数コミットが含まれると古いコミットで追加された migration を見落とし、**誤ってスキップする**（最悪の失敗モード）ため。タグ方式なら多コミット push でも正確で、migrate や deploy が失敗した回はタグが進まないため次回必ず再実行される。

### 採用理由

- 「CI が緑になってから本番 DB を触る」を branch protection の設定状況に依存せず、ワークフロー自身の条件で保証できる
- Vercel CLI の同期的な完了待ちにより、`needs` の直列化だけで migrate → backend → frontend の順序が成立する。追加のポーリング実装が不要
- `github.event.workflow_run.head_sha` を checkout することで「CI が検証したコミット」と「デプロイするコミット」が構造的にズレない
- `vercel pull` を使うことで本番資格情報の管理場所が Vercel 1 箇所に収束する。issue 当初の想定（GitHub Secrets へ登録）より管理点が減る

## Consequences

### Positive

- 本番 `DATABASE_URL` が開発者のローカルに常駐しなくなる
- migrate → backend → frontend の順序が仕組みとして保証され、人手の順序ミスが起こりえなくなる
- 誰がいつ何をデプロイしたかが Actions の実行履歴として残る
- `production-deployed` タグにより「いま本番に入っている SHA」が可視化される。切り戻し・障害調査の起点になる
- 本番資格情報の管理点が Vercel 1 箇所に収束し、ローテーションが 1 回の更新で済む
- Environment スコープの secrets により、`environment:` を宣言しない `ci.yml`（`pull_request` を含む）は構造的に本番資格情報へアクセスできない

### Negative

- `workflow_run` はワークフロー定義が default branch に存在しないと発火しないため、**PR 上でワークフロー全体の E2E 検証ができない**
  - → `workflow_dispatch` を併設し、main へ入った後に手動実行で検証する
- Vercel のダッシュボード設定（Git 連携）とリポジトリのコード（`vercel.json`）の両方を触る必要があり、導入時の手数が増える
- `guard` の `if` 式が長くなり、条件を読み解くコストがある
  - → 条件を 1 ジョブに集約することで、少なくとも重複はさせない
- ビルドが Vercel のビルドイメージではなく `ubuntu-24.04` ランナー上で行われるため、両者に差異があればデプロイ結果が変わりうる
  - → 既存 `ci.yml` の `build` ジョブが同じ `ubuntu-24.04` で `backend build` / `frontend build` を検証しているため実質的なリスクは小さい

### Risks

- **migrate が backend デプロイより先に走るため、「旧 backend が動いている状態で新スキーマが適用される瞬間」が必ず存在する**。ロールバック自動化はスコープ外であり前進のみの運用となるため、後方互換（additive）なマイグレーションを原則とする必要がある
  - → カラム削除・`SET NOT NULL`・リネームは expand → contract の 2 段リリースに分ける。既存履歴には `DROP TABLE` × 2 / `DROP COLUMN` × 1 / `SET NOT NULL` × 1 が含まれており、自動化後は同じ書き方が本番で危険になる
  - → この原則を `docs/deployment-guide.md` に明記する
- Vercel 側の `DATABASE_URL` が Neon の pooled 接続（`-pooler`）である場合、PgBouncer 経由の DDL で問題が出うる
  - → `vercel pull` の結果に `DATABASE_URL_UNPOOLED` / `POSTGRES_URL_NON_POOLING` があれば migrate ではそちらを優先する。導入時に pull 結果のキー一覧を確認する
- Vercel CLI のバージョンアップで `pull` / `build` / `deploy` の挙動や `.vercel/` の構造が変わる可能性がある
  - → CLI のバージョンは `@latest` にせずワークフロー内で pin する
- `git.deploymentEnabled` を false にした状態で CLI デプロイが通るかは未検証
  - → 通らない場合は Vercel ダッシュボードの Ignored Build Step（常に `exit 0`）へフォールバックする
- 将来 `CREATE INDEX CONCURRENTLY` 等トランザクション内で実行できない文を導入した場合、失敗時に部分適用状態になりうる
  - → 現行の `0000`〜`0013` には含まれていない。導入時に個別に慎重にレビューする

## 決めていないこと

| 項目 | 決めない理由 | いつ決めるか |
|------|------------|------------|
| Environment 保護ルールによる手動承認ゲート | ソロ運用では毎回のクリックが摩擦になる。`production` environment 自体は secrets スコープのために作るので、後から承認者を追加するだけで有効化できる | 誤ったマイグレーションを本番へ流してしまったら、あるいは開発者が増えたら |
| migrate 専用の DDL 権限ロールを Neon に作る | 「二重管理」ではなく「役割の違う別資格情報」として GitHub Secrets に持つ案。セキュリティ上は最も強いが、Neon 側のロール・権限設計の運用コストが現在の規模に見合わない | 本番データの規模が増え、runtime の権限を絞る必要が出たら |
| `drizzle-kit check` を CI に組み込む | スキーマとマイグレーションフォルダの整合性を自動検証できるが、現状は PR の SQL 差分レビューで足りている | 生成漏れ・整合性崩れが実際に発生したら |
| ロールバックの自動化 | Drizzle は前進のみを前提としており、down マイグレーションの仕組みを持たない。expand → contract 運用で回避する方針 | 別 issue で検討（スコープ外） |
| Neon branching による PR ごとの検証環境 | 本 issue のスコープ外。まず本番の順序保証を成立させることを優先する | 将来検討（スコープ外） |
| デプロイ失敗時の Slack 等への通知 | GitHub のデフォルト通知（main での workflow 失敗メール）で気づける規模 | 見落としが実際に発生したら |

## Notes

### 参考資料

- [Vercel — Deploying to Vercel with GitHub Actions](https://vercel.com/guides/how-can-i-use-github-actions-with-vercel)
- [Vercel — Deploy Hooks](https://vercel.com/docs/deploy-hooks)
- [Vercel — Project Configuration: `git.deploymentEnabled`](https://vercel.com/docs/project-configuration#git.deploymentenabled)
- [Drizzle — Migrations](https://orm.drizzle.team/docs/migrations)
- [Neon — Connect from Vercel](https://neon.tech/docs/guides/vercel)
- [GitHub Actions — `workflow_run` イベント](https://docs.github.com/en/actions/reference/events-that-trigger-workflows#workflow_run)
- [GitHub Actions — Using environments for deployment](https://docs.github.com/en/actions/how-tos/deploy/configure-and-manage-deployments/manage-environments)
- 関連 ADR: [0007](./0007-hono-vercel-build-output-api.md)（backend の Vercel デプロイ方式。本 ADR はその `vercel.json` 構成をそのまま維持する）
- 関連ドキュメント: `docs/ci-migration-automation.md`（ワークフローの詳細設計）、`docs/deployment-guide.md`（運用手順）
