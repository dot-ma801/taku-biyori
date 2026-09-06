import process from 'node:process';
import { defineConfig, devices } from '@playwright/test';

/**
 * UI 移行用の視覚回帰テスト（VRT）設定。
 * e2e（playwright.config.ts）とは目的も実行タイミングも違うので設定ファイルを分けている。
 *
 *   pnpm --filter @taku-biyori/frontend vrt         # 検証
 *   pnpm --filter @taku-biyori/frontend vrt:update  # 基準画像の撮り直し
 */
export default defineConfig({
  testDir: './vrt',
  timeout: 30 * 1000,
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: 0,
  workers: process.env.CI ? 2 : undefined,
  reporter: [['html', { outputFolder: 'vrt-report', open: 'never' }]],
  outputDir: './vrt-results',
  // ディレクトリ名を __screenshots__ にしない。
  // .gitignore が Vitest の慣習として __screenshots__/ を除外しており、
  // 基準画像は追跡したいため衝突する。
  snapshotPathTemplate: '{testDir}/screenshots/{arg}{ext}',

  expect: {
    toHaveScreenshot: {
      // 実行環境ごとのアンチエイリアス差を吸収しつつ、
      // 色・余白・字形の変化は拾える程度のしきい値。
      // 誤検知が続くようなら上げる前に、まず環境差の原因を疑うこと。
      threshold: 0.25,
      maxDiffPixelRatio: 0.02,
      animations: 'disabled',
      scale: 'css',
    },
  },

  use: {
    ...devices['Desktop Chrome'],
    baseURL: 'http://127.0.0.1:6007',
    headless: true,
    deviceScaleFactor: 1,
    // 基準画像は「CI と同じ Chromium」で撮る必要がある（scripts/vrt-docker.sh 参照）。
    // ブラウザを別の場所に持っている環境向けの逃げ道としてだけ用意している。
    launchOptions: process.env.VRT_CHROMIUM_PATH
      ? { executablePath: process.env.VRT_CHROMIUM_PATH }
      : {},
  },

  projects: [{ name: 'chromium' }],

  webServer: {
    command: 'node scripts/serve-static.mjs storybook-static 6007',
    url: 'http://127.0.0.1:6007/index.json',
    reuseExistingServer: !process.env.CI,
  },
});
