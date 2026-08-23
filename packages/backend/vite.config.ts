import { fileURLToPath, URL } from 'node:url';
import { builtinModules } from 'node:module';
import { defineConfig } from 'vitest/config';
import honoPreset from '@hono/vite-build/node';

export default defineConfig({
  plugins: [
    honoPreset({
      entry: 'src/index.ts',
      output: 'index.js',
      emptyOutDir: true,
    }),
  ],
  resolve: {
    alias: {
      '@': fileURLToPath(new URL('./src', import.meta.url)),
      '@test': fileURLToPath(new URL('./test', import.meta.url)),
    },
  },
  build: {
    rollupOptions: {
      external: [...builtinModules, ...builtinModules.map((m) => `node:${m}`)],
    },
  },
  test: {
    // リポジトリ層のテストが実 DB へ接続するため、.env の TEST_DATABASE_URL を読み込む
    setupFiles: ['./test/setup.ts'],
    // ロック競合のテストは他トランザクションの待ちを挟むため既定より長く取る
    testTimeout: 30_000,
    hookTimeout: 30_000,
  },
});
