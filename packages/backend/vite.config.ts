import { fileURLToPath, URL } from 'node:url';
import { builtinModules } from 'node:module';
import { defineConfig } from 'vite';
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
    },
  },
  build: {
    rollupOptions: {
      external: [...builtinModules, ...builtinModules.map((m) => `node:${m}`)],
    },
  },
});
