import { fileURLToPath, URL } from 'node:url';
import { readFileSync, writeFileSync } from 'node:fs';
import { defineConfig, type Plugin } from 'vite';
import vercelBuild from '@hono/vite-build/vercel';

/**
 * 関数を実行するリージョン。
 *
 * DATABASE_URL が指す Neon は ap-southeast-2（シドニー）にあり、既定の iad1（米国東部）で
 * 動かすと DB クエリのたびに片道 200ms 程度を往復してしまう。DB と同じ場所へ寄せる。
 * Hobby プランでも 1 リージョンなら選択できる。
 */
const FUNCTION_REGION = 'syd1';

/** @hono/vite-build/vercel が生成する関数ディレクトリ */
const VC_CONFIG_PATH = '.vercel/output/functions/__hono.func/.vc-config.json';

/**
 * ビルド成果物の .vc-config.json にリージョンを書き込みます。
 *
 * Build Output API ではリージョンの指定箇所は関数ごとの .vc-config.json だが、
 * @hono/vite-build/vercel はこのフィールドを出力しない。vercel.json の regions が
 * この構成で読まれるかは確証がないため、仕様上の正規の場所へ後から差し込む。
 */
const setFunctionRegion = (): Plugin => ({
  name: 'set-function-region',
  // 関数ディレクトリが出揃ってから触る必要があるため closeBundle で行う
  closeBundle() {
    let raw: string;
    try {
      raw = readFileSync(VC_CONFIG_PATH, 'utf-8');
    } catch {
      // アダプタの出力形式が変わるとリージョン指定が黙って失われるため、気づけるように落とす
      throw new Error(
        `${VC_CONFIG_PATH} が見つかりません。@hono/vite-build の出力形式が変わった可能性があります`,
      );
    }

    const config = JSON.parse(raw) as Record<string, unknown>;
    writeFileSync(
      VC_CONFIG_PATH,
      JSON.stringify({ ...config, regions: [FUNCTION_REGION] }),
    );
  },
});

export default defineConfig({
  plugins: [
    vercelBuild({
      entry: 'src/index.ts',
    }),
    setFunctionRegion(),
  ],
  resolve: {
    alias: {
      '@': fileURLToPath(new URL('./src', import.meta.url)),
    },
  },
  build: {
    rollupOptions: {
      output: {
        // 分割チャンク（assets/）は serverless function に同梱されないため単一ファイルに固める
        inlineDynamicImports: true,
      },
    },
  },
});
