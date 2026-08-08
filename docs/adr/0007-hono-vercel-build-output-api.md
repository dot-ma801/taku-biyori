# ADR 0007: backend の Vercel デプロイに Build Output API（@hono/vite-build/vercel）を採用する

## Status

Proposed

## Context

本プロジェクトの backend（`packages/backend`）は Hono 4.x + `@hono/node-server` で構成され、`@hono/vite-build/node` プラグインにより `dist/index.js` へ単一バンドルする standalone Node.js サーバーとしてビルドしている。モノレポ（pnpm workspaces）構成で、`@taku-biyori/shared` への workspace 依存と `@/` パスエイリアスを持つ。

これを Vercel にデプロイしたところ、API が動作しなかった。

### 解決したい課題

- `vercel.json` の `outputDirectory: "dist"` 構成では、Vercel がビルド成果物を**静的ファイルとして配信**してしまい、serverless function として実行されない
- Vercel が関数として認識できる構成（`api/` ディレクトリ、または Build Output API）が存在しなかった
- `@vercel/node` のバンドラは tsconfig の `paths`（`@/` エイリアス）を解決できないため、ソースを直接 function 化する構成が取れない

### 検討した選択肢

1. **`@hono/vite-build/vercel` で Build Output API v3 を直接生成する**
2. **`api/index.ts` + rewrites で `src` を直接 import する**（Vercel 標準の `api/` ディレクトリ方式）
3. **`api/index.ts` からビルド済み `dist/index.js` を import する**
4. **Hono framework preset（ゼロコンフィグ）に任せる**

### 各選択肢の評価

| 観点 | 1. Build Output API | 2. api/ + src 直接 import | 3. api/ + dist import | 4. framework preset |
|------|---------------------|---------------------------|------------------------|---------------------|
| `@/` エイリアス解決 | ✅ vite build 内で解決 | ❌ @vercel/node が paths 非対応 | ✅ 解決済みバンドルを参照 | ❓ 不透明 |
| workspace 依存（shared） | ✅ バンドルに内包 | ❌ 同上の問題に巻き込まれる | ✅ バンドルに内包 | ❓ 不透明 |
| ラムダ内での動作 | ✅ `@hono/node-server/vercel` の `handle()` にラップ | ✅ | ❌ `@hono/vite-build/node` が無条件に `serve()` を埋め込みポート listen が走る | ❓ |
| 追加ファイル | vite config 1つ | api/ + rewrites + eslint 例外 | 同左 | なし |

## Decision

**backend の Vercel デプロイは、`@hono/vite-build/vercel` アダプタで Vercel Build Output API v3（`.vercel/output/`）を直接生成する方式を採用する。**

### 1. Vercel 専用の vite config を追加する

ローカル用の `vite.config.ts`（`@hono/vite-build/node`）はそのまま残し、Vercel 用に `vite.config.vercel.ts` を追加する二本立てとする。

```ts
// packages/backend/vite.config.vercel.ts
import vercelBuild from '@hono/vite-build/vercel';

export default defineConfig({
  plugins: [vercelBuild({ entry: 'src/index.ts' })],
  resolve: { alias: { '@': ... } },
  build: {
    rollupOptions: {
      output: {
        // 分割チャンク（assets/）は serverless function に同梱されないため単一ファイルに固める
        inlineDynamicImports: true,
      },
    },
  },
});
```

`inlineDynamicImports: true` は必須。これがないと better-auth 等の動的 import が `assets/` チャンクに分割され、function ディレクトリ（`functions/__hono.func/`）の外に出力されるため実行時に解決できない。

### 2. `build:vercel` script と vercel.json

```json
// package.json
"build:vercel": "tsc --noEmit && tsc --noEmit -p tsconfig.node.json && vite build --config vite.config.vercel.ts"
```

```json
// vercel.json — outputDirectory を指定しないことが重要
{
  "installCommand": "cd ../.. && pnpm install --frozen-lockfile",
  "buildCommand": "cd ../.. && pnpm --filter @taku-biyori/shared build && pnpm --filter @taku-biyori/backend build:vercel"
}
```

`.vercel/output/` が存在すると Vercel は Build Output API として扱うため、`outputDirectory` は指定しない（指定すると静的配信に戻ってしまう）。

### 3. ルーティング

アダプタが生成する `config.json` の routes は `/(.*) → /__hono` であり、**全パスが単一の Node serverless function に届く**。health ルート（`/`）、業務 API（`/api/...`）、Better Auth（`/api/auth/**`）のいずれも Hono 側のルーティングがそのまま機能する。

### 4. `@opentelemetry/api` を dependencies に追加する

`@better-auth/core` が optional peer dependency として `@opentelemetry/api` を import しており、未インストールだと Rollup が「throw するスタブモジュール」に置換してバンドルがロード時に落ちる。backend の dependencies に明示的に追加してバンドルに内包させる。

### 5. 実行リージョンは Vercel ダッシュボードで設定する

**⚠️ この設定はリポジトリ内に存在しない。** 実行リージョンは Vercel プロジェクトの
**Settings → Functions → Function Region** で `Asia Pacific / Sydney (syd1)` に設定している。

`DATABASE_URL` が指す Neon は `ap-southeast-2`（シドニー）にあり、Vercel 既定の `iad1`（米国東部）で
動かすと DB クエリのたびに片道 200ms 程度を往復する。1 リクエストで DB を 5〜6 往復する経路があるため、
これだけで 1 秒以上の遅延になっていた（#106）。関数を DB と同じリージョンへ寄せることで解消する。

**なぜコードで指定しないか。** Build Output API でリージョンを指定する正規の場所は関数ごとの
`.vc-config.json` の `regions` だが、`@hono/vite-build/vercel` はこのフィールドを出力しない。

```json
// .vercel/output/functions/__hono.func/.vc-config.json（アダプタの出力そのまま）
{"runtime":"nodejs22.x","launcherType":"Nodejs","handler":"index.js", ...}
```

`vercel.json` の `regions`（プロジェクトレベル設定）が適用されるはずだが、この構成で確実に読まれるかの
確証が取れなかったため、確実に効くダッシュボード設定を採用した。`vercel.json` にも
`"regions": ["syd1"]` を残しているが、**実際に効いているのはダッシュボード側**である。

> ビルド成果物の `.vc-config.json` を後処理で書き換える案も検討したが、他プラグインの出力に依存する
> 非標準の回避策であり、未検証の失敗を先回りして対策する形になるため採用しなかった。

**変更する場合。** ダッシュボードで変更したあと、反映には**新規デプロイが必要**。確認は本番の
レスポンスヘッダー `x-vercel-id` を見る。

```
x-vercel-id: hnd1:hnd1:hnd1::syd1::rv6jx-1786193718078-fed5b953688f
             ^^^^                   ^^^^
             受けたエッジ PoP        関数の実行リージョン
```

先頭はリクエストを受けたエッジ PoP（日本からなら `hnd1` 等）であり、**関数の実行リージョンは後方の
セグメント**。先頭だけ見ても判定にならない。

Hobby プランでは 1 リージョンのみ選択可能（複数リージョンは Pro 以上）。

### 採用理由

- `src/index.ts` を一切変更せず（`export default app` + 直接実行ガードの現構成がアダプタの要件を満たす）、ローカル開発・CI に影響を与えない
- vite build 内で `@/` エイリアスと workspace 依存を解決するため、@vercel/node の制約を回避できる
- `@hono/vite-build` は既存の依存であり、新規ライブラリの追加が最小限で済む

## Consequences

### Positive

- Vercel 上で backend が serverless function として動作し、静的配信の問題が根治する
- ローカル開発（`dev` / `build` / `start`）と CI は既存フローのまま無変更
- 単一関数・単一バンドルのため、コールドスタート時のファイル解決が単純

### Negative

- ビルド構成が二本立て（`vite.config.ts` / `vite.config.vercel.ts`）になり、vite 設定変更時は両方への反映を意識する必要がある
  - → alias 等の共通部分が増える場合は共通 config の切り出しを検討する
- `build:vercel` の失敗は CI では検知されず、Vercel のデプロイ結果でしか分からない
  - → 必要になったら CI の Build ジョブに `build:vercel` を 1 ステップ追加する（現状はスコープ外）
- **実行リージョンの設定がリポジトリ外（Vercel ダッシュボード）にあり、コードを読んでも気づけない**
  - → 本 ADR の「5. 実行リージョンは Vercel ダッシュボードで設定する」を唯一の記録とする
  - → プロジェクトを作り直した場合や別環境を立てる場合、設定漏れに気づかないまま遅くなる。
    新環境を用意したら `x-vercel-id` でリージョンを確認すること

### Risks

- `@hono/vite-build` のバージョンアップでアダプタの出力形式（`__hono` 関数名や routes）が変わる可能性がある
  - → アップデート時は `pnpm --filter @taku-biyori/backend build:vercel` で `.vercel/output/config.json` の内容を確認する
- アダプタが将来 `.vc-config.json` に `regions` を出力するようになると、ダッシュボード設定より
  関数ごとの指定が優先されるため、意図しないリージョンで動く可能性がある
  - → アップデート時は `.vercel/output/functions/__hono.func/.vc-config.json` に `regions` が
    含まれていないかもあわせて確認する
- 全パスが単一関数のため、将来エンドポイント単位でランタイムを分けたくなった場合は構成の見直しが必要
  - → その時点で `api/` ディレクトリ方式への移行を再検討する

## 決めていないこと

| 項目 | 決めない理由 | いつ決めるか |
|------|------------|------------|
| `build:vercel` の CI 組み込み | Vercel 側のビルドで検知でき、現時点で CI 時間を増やす必要がない | Vercel ビルド起因の破損が繰り返し発生したら |
| Edge ランタイムへの移行 | postgres ドライバと Better Auth が Node.js ランタイムを前提としている | DB 接続方式（HTTP ドライバ等）を見直すタイミング |

## Notes

### 参考資料

- [Hono — Vercel deployment](https://hono.dev/docs/getting-started/vercel)
- [Vercel Build Output API v3](https://vercel.com/docs/build-output-api/v3)
- [Configuring regions for Vercel Functions](https://vercel.com/docs/functions/configuring-functions/region)
- [Vercel — Global network and regions](https://vercel.com/docs/regions)
- 関連 issue: #106（実行リージョンを `syd1` に設定した経緯）
- 関連 ADR: なし（Vercel デプロイに関する初の ADR）
