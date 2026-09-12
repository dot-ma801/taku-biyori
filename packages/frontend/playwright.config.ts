import process from 'node:process';
import { fileURLToPath } from 'node:url';
import { config as loadEnv } from 'dotenv';
import { defineConfig, devices } from '@playwright/test';

// 接続先はバックエンドの .env が正。CI では env で直接渡すため、既存の値は上書きしない
loadEnv({ path: fileURLToPath(new URL('../backend/.env', import.meta.url)) });

/**
 * e2e 専用のポートとデータベースで動かす。
 * 開発中の dev サーバー（3000 / 5173）と同時に起動しても衝突しない。
 */
const BACKEND_PORT = 3100;
const FRONTEND_PORT = 5273;
const backendUrl = `http://localhost:${BACKEND_PORT}`;
const frontendUrl = `http://localhost:${FRONTEND_PORT}`;

const e2eDatabaseUrl = process.env.E2E_DATABASE_URL;

if (!e2eDatabaseUrl) {
  throw new Error(
    'E2E_DATABASE_URL is required. packages/backend/.env.example を参照して設定し、' +
      'pnpm --filter @taku-biyori/backend db:e2e:setup を実行してください',
  );
}

export default defineConfig({
  testDir: './e2e',
  globalSetup: './e2e/global-setup.ts',
  timeout: 30 * 1000,
  expect: { timeout: 5000 },
  fullyParallel: false,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  workers: 1,
  reporter: process.env.CI ? [['list'], ['html', { open: 'never' }]] : 'html',
  use: {
    actionTimeout: 0,
    baseURL: frontendUrl,
    trace: 'on-first-retry',
    headless: !!process.env.CI,
  },

  projects: [
    // ログイン状態を作る。他のテストはこれが保存した storageState を使い回す
    { name: 'setup', testMatch: /auth\.setup\.ts$/ },
    {
      name: 'chromium',
      use: {
        ...devices['Desktop Chrome'],
        storageState: 'e2e/.auth/user.json',
      },
      dependencies: ['setup'],
    },
  ],

  webServer: [
    {
      command: 'pnpm exec tsx src/index.ts',
      cwd: fileURLToPath(new URL('../backend', import.meta.url)),
      url: backendUrl,
      reuseExistingServer: !process.env.CI,
      env: {
        DATABASE_URL: e2eDatabaseUrl,
        PORT: String(BACKEND_PORT),
        BETTER_AUTH_URL: backendUrl,
        // e2e 専用の使い捨てセッションにしか使わない
        BETTER_AUTH_SECRET: 'e2e-only-not-a-real-secret',
        FRONTEND_URL: frontendUrl,
      },
    },
    {
      command: `pnpm exec vite --port ${FRONTEND_PORT} --strictPort`,
      url: frontendUrl,
      reuseExistingServer: !process.env.CI,
      env: { VITE_API_URL: backendUrl },
    },
  ],
});
