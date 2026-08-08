import { fileURLToPath, URL } from 'node:url';
import { defineConfig } from 'vite';
import vercelBuild from '@hono/vite-build/vercel';

export default defineConfig({
  plugins: [
    vercelBuild({
      entry: 'src/index.ts',
    }),
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
