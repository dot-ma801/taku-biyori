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
    // ロック競合のテスト（test/integration/row-lock-contention.test.ts）だけが
    // 他トランザクションの待ちを挟むため長い timeout を必要とする。ここを
    // グローバルに 30 秒へ延ばすと DB 不要な test/unit/ のハング検知まで
    // 遅くなってしまうため、既定値のままにし、該当ファイル側で
    // `vi.setConfig()` によりファイル単位で timeout を延ばしている。
  },
});
