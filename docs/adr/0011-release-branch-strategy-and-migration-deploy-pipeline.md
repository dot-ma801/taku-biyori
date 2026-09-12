# ADR 0011: リリースブランチ戦略と、本番マイグレーション・Vercel デプロイの順序保証

## Status

Proposed

## Context

本プロジェクトは `packages/backend` と `packages/frontend` をそれぞれ独立した Vercel プロジェクトとしてデプロイしている（ADR 0007）。Vercel の Git 連携により、GitHub へのブランチ push をトリガーとして自動でビルド・デプロイが行われる。

これまでの運用は次のようになっていた。

- `main` への push（PR マージ）で Vercel が自動的に本番デプロイを行う
- DB マイグレーション（`drizzle-kit migrate`）は、開発者がローカル端末から本番の `DATABASE_URL` に向けて手動実行していた
- `main` 以外のブランチ（feature ブランチ等）への push でも、Vercel の Git 連携により自動でプレビューデプロイが作成されていた

この運用には、リリースサイクルを整備するにあたって解決したい課題があった。

### 解決したい課題

- **マイグレーションが手動**: 本番マイグレーションの実行漏れ・実行順序ミスが発生しうる。「コードはデプロイされたがスキーマは未反映」「逆にスキーマだけ先に変わっている」といった不整合のリスクが、実行者の記憶と手順に依存している
- **リリース単位の管理がない**: 個々の feature ブランチが `main` に直接マージされる構成では、「今回のリリースに含める機能セット」をまとめて検証してから本番に出す、という単位が存在しない
- **プレビューデプロイが実効性を持たない**: `packages/frontend/vercel.json` の rewrites は API リクエストを本番バックエンドの固定 URL（`https://taku-biyori-backend.vercel.app`）に向けている。プレビュー環境専用のバックエンド URL や、プレビュー用に分離された DB も存在しないため、feature ブランチのプレビューデプロイは「そのブランチの変更を通しで確認する」用途を果たせず、実質的に本番 API を叩くだけになっていた

### 検討した選択肢

**ブランチ戦略について**

1. トランクベース（feature ブランチ → `main` に直接マージ）
2. リリースブランチ方式（`main` → `develop/{version}` を作成し、feature ブランチは `develop/{version}` に集約 → 十分に機能が揃ったら `develop/{version}` を `main` にマージ）

**マイグレーションとデプロイの順序保証について**

1. Vercel の `buildCommand` の中で `db:migrate` を実行する
2. GitHub Actions で `db:migrate` を実行しつつ、Vercel の Git 連携による自動デプロイもそのまま並走させる（順序は保証しない）
3. GitHub Actions で `db:migrate` を実行し、成功後に Vercel の Deploy Hook を叩いてデプロイを開始する。Vercel の Git 連携自体は `ignoreCommand` で常時無効化する

**プレビューデプロイの扱いについて**

1. 現状維持（feature ブランチにプレビューデプロイを残す）
2. `main` 以外のブランチでは Vercel のビルドを一切走らせない

### 各選択肢の評価

| 観点 | トランクベース | リリースブランチ方式 |
|------|----------------|----------------------|
| リリース単位の可視性 | ❌ 個々の PR がそのまま本番反映の単位になる | ✅ `develop/{version}` が「次に出すリリース」の単位として機能する |
| 複数機能をまとめて検証 | ❌ 各 PR は個別に `main` へ入るため、機能間の組み合わせ検証がしづらい | ✅ `develop/{version}` 上で機能同士の組み合わせを検証してから `main` に出せる |
| 運用の複雑さ | ✅ シンプル | △ ブランチが一段増える |

| 観点 | 1. buildCommand 内で migrate | 2. GitHub Actions + Git連携を並走 | 3. GitHub Actions + Deploy Hook |
|------|-------------------------------|-------------------------------------|-----------------------------------|
| プレビュー環境で誤って本番DBに migrate される危険 | ❌ ある（`ignoreCommand` で防がない限り、プレビュービルドでも同じ buildCommand が走る） | ✅ ない（migrate は明示的に `main` 用ワークフローでのみ実行） | ✅ ない |
| マイグレーションとデプロイの順序保証 | △ 同一ビルド内なので順序自体は保証されるが、失敗時の切り分け（migrate 失敗かビルド失敗か）がしづらい | ❌ 保証されない。新スキーマ前提のコードが旧スキーマに、あるいはその逆にアクセスする瞬間が起こりうる | ✅ migrate 成功を確認してからデプロイを開始するため保証される |
| ビルドとマイグレーションの責務分離 | ❌ 混在する | ✅ 分離される | ✅ 分離される |
| 実装の追加コスト | ✅ 低い（vercel.json の変更のみ） | △ ワークフロー追加のみ | △ ワークフロー追加 + Deploy Hook の作成（手動） |

| 観点 | 1. プレビューデプロイ現状維持 | 2. main 以外はビルドしない |
|------|-------------------------------|------------------------------|
| 実効性 | ❌ 本番 API 固定 URL を叩くだけで、そのブランチの変更を確認できない | — （そもそも生成しない） |
| 無駄なビルド実行・ビルド時間消費 | ❌ 毎 push でビルドが走る | ✅ 発生しない |
| 誤操作リスク（未マージの変更が本番APIと組み合わさる） | ❌ ある | ✅ ない |

## Decision

**`main` から `develop/{version}` を作成するリリースブランチ方式を採用し、Vercel の Git 連携による自動ビルドは常時無効化した上で、`main` へのマージ後にのみ GitHub Actions が「本番マイグレーション → Vercel Deploy Hook 起動」の順で実行する。**

### 1. ブランチ戦略

```
main
 └── develop/1.0          ← main の最新から作成。次リリースの受け皿
      ├── feature/aaa     ← develop/1.0 から派生し、develop/1.0 にマージ
      ├── feature/bbb
      └── ...
```

- リリース対象の機能が `develop/1.0` に十分揃ったら、`develop/1.0` を `main` にマージする
- 次のリリースサイクルに入る際は、`main` から新たに `develop/{次バージョン}` を作成する

### 2. Vercel の Git 連携を常時無効化する

`packages/backend/vercel.json` / `packages/frontend/vercel.json` の両方に `ignoreCommand` を追加し、ブランチを問わず Git push によるビルドを常にスキップする。

```json
{
  "ignoreCommand": "exit 0"
}
```

Vercel の仕様上、`ignoreCommand` が終了コード `0` を返すとビルドはスキップされる。これにより `main` を含むどのブランチへの push でも Git 連携経由の自動ビルドは発生しなくなり、`develop/1.0` や `feature/*` のプレビューデプロイも同時に無くなる。

### 3. 本番デプロイは Deploy Hook 経由でのみキックする

Vercel の Deploy Hook は `ignoreCommand`（Ignored Build Step）を無視し、呼び出されると必ずビルド・デプロイを実行する。この性質を使い、本番デプロイのトリガーを Git push から GitHub Actions からの明示的な呼び出しに切り替える。

### 4. GitHub Actions でマイグレーションとデプロイを順序付ける

新規ワークフロー `.github/workflows/migrate-and-deploy.yml` を追加した。

```yaml
on:
  workflow_run:
    workflows: ['CI']
    branches: [main]
    types: [completed]

jobs:
  migrate-and-deploy:
    if: github.event.workflow_run.conclusion == 'success'
    steps:
      # ... checkout / setup ...
      - name: Run production migrations
        run: pnpm --filter @taku-biyori/backend db:migrate
        env:
          DATABASE_URL: ${{ secrets.PRODUCTION_DATABASE_URL }}
      - name: Trigger Vercel deploy (backend)
        run: curl -fsS -X POST "${{ secrets.VERCEL_DEPLOY_HOOK_BACKEND }}"
      - name: Trigger Vercel deploy (frontend)
        run: curl -fsS -X POST "${{ secrets.VERCEL_DEPLOY_HOOK_FRONTEND }}"
```

既存の `CI` ワークフロー（`main` への push で lint / typecheck / test / build を実行）が成功したことを `workflow_run` トリガーで検知し、そのコミットに対して `db:migrate` を実行する。`db:migrate` が成功した場合のみ、後続ステップで Deploy Hook を呼び出す。`db:migrate` が失敗すればジョブはその時点で止まり、Deploy Hook は呼ばれない（＝新スキーマ前提のコードが本番にデプロイされることはない）。

### 採用理由

- ブランチ戦略は、リリース単位でまとめて機能を検証したいという要求（今回のモチベーション）に対して、`develop/{version}` という単位を導入することで直接応える
- `ignoreCommand` + Deploy Hook の組み合わせは Vercel が公式に想定する「Git push では自動デプロイさせず、外部から明示的にデプロイをトリガーしたい」場合の標準的なパターンであり、追加のインフラ（自前のデプロイスクリプト等）を必要としない
- `workflow_run` による順序付けは、Vercel の buildCommand 内に migrate を混在させる案と比べて、ビルドの成否とマイグレーションの成否を GitHub Actions のジョブログ上で明確に切り分けられる

## Consequences

### Positive

- マイグレーションの実行漏れ・手順ミスがなくなり、`main` へのマージ後は人手を介さず本番に反映される
- `develop/{version}` を通じてリリース単位が明示的になり、複数機能を組み合わせた状態で `main` マージ前に確認できる
- 実効性のなかったプレビューデプロイのビルド実行が無くなり、Vercel のビルド時間を消費しなくなる

### Negative

- `main` へのマージ後、実際に本番へ反映されるまでに CI 完走 + migrate の分だけ遅延が生じる（Git push 直後には反映されない）
  - → リリースのタイミングを急ぐ場合は GitHub Actions の実行状況（Actions タブ）を確認すればよく、遅延自体は数分程度に収まる想定
- `feature/*` ブランチでの見た目の確認手段（プレビューデプロイ）が無くなり、ローカル起動での確認に一本化される
  - → プレビュー用の分離された DB / バックエンド URL を用意できる目処が立った時点で、プレビューデプロイの復活を再検討する
- ブランチが `main` / `develop/{version}` / `feature/*` の3階層になり、トランクベースと比べて運用が一段複雑になる
  - → `develop/{version}` は常に1本のみ運用し、多重運用（複数バージョンの同時開発）はしない前提とする

### Risks

- `db:migrate` はデフォルトで destructive な変更（カラム削除等）も無条件に本番へ適用してしまう。ロールバック不能な変更が誤って `develop/{version}` にマージされた場合、そのまま本番に適用される
  - → 破壊的変更を含む PR は `develop/{version}` へのマージ時点でレビューを厳格化する。将来的には migration ファイルの内容を静的にチェックする仕組みの導入を検討する
- `db:migrate` が失敗した場合、`main` にはコードがマージ済みだがデプロイはされていない状態になる。次に別の PR がマージされると、その migrate 実行時に前回失敗分も含めて再試行されることになり、原因の切り分けが難しくなる可能性がある
  - → migrate 失敗時は GitHub Actions の通知を確認し、原因を解消してから再実行する（`workflow_run` を手動 re-run するか、空コミットで `main` に再度 push する）運用とする
- Deploy Hook の URL 自体が漏洩すると、誰でも任意のタイミングでデプロイを起動できてしまう
  - → GitHub Secrets として管理し、リポジトリの Secrets 閲覧権限を持つメンバーを最小限に保つ

## 決めていないこと

| 項目 | 決めない理由 | いつ決めるか |
|------|------------|------------|
| Vercel Deploy Hook の作成、および GitHub Secrets（`PRODUCTION_DATABASE_URL` / `VERCEL_DEPLOY_HOOK_BACKEND` / `VERCEL_DEPLOY_HOOK_FRONTEND`）への値の登録 | Vercel ダッシュボード上の手動操作が必要で、コード変更のスコープ外 | この ADR のマージ後、リポジトリ管理者が Vercel プロジェクト設定（Git → Deploy Hooks）と GitHub の Secrets 設定から実施する |
| 破壊的マイグレーション（カラム削除等）における新旧コードの後方互換の担保方法（expand/contract パターンの採用可否） | 現状のリリース頻度・チーム規模ではまだ問題が顕在化していない | 破壊的変更を伴う PR が実際に発生したタイミングで個別に検討する |
| migrate 失敗時・デプロイ後に不具合が出た場合のロールバック手順 | 本 ADR は「順序を保証する」ことがスコープであり、失敗後の復旧手順は別途の運用整備が必要 | 実際に migrate 失敗またはデプロイ後の不具合が発生した際、その事例をもとに手順化する |
| feature/* ブランチのプレビューデプロイの再導入（プレビュー用 DB・バックエンド URL の分離） | プレビュー環境の分離には Neon のブランチDB機能や環境変数のスコープ設計など、別途の設計判断が必要 | プレビュー環境での確認ニーズが具体的に高まったタイミングで再検討する |

## Notes

### 参考資料

- [Vercel — Ignored Build Step](https://vercel.com/docs/deployments/configure-a-build#ignored-build-step)
- [Vercel — Deploy Hooks](https://vercel.com/docs/deployments/deploy-hooks)
- 関連 ADR: [0007](./0007-hono-vercel-build-output-api.md)（backend の Vercel デプロイ構成）
