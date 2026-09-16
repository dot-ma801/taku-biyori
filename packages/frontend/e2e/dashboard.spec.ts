import { test, expect } from '@playwright/test';
import { SCHEDULED_LOBBY_TITLE } from './fixtures';

test('ダッシュボードに、日程の決まった卓が状態つきで並ぶ', async ({ page }) => {
  await page.goto('/dashboard');

  await expect(
    page.getByRole('heading', { name: 'ダッシュボード', level: 1 }),
  ).toBeVisible();

  await expect(
    page.getByRole('link', { name: `${SCHEDULED_LOBBY_TITLE} を開く` }),
  ).toBeVisible();
  await expect(page.getByText('開催予定', { exact: true })).toBeVisible();

  // 調整中は0件なので、空の見出しと案内が出る
  await expect(
    page.getByRole('heading', { name: '日程を調整中の卓' }),
  ).toBeVisible();
  await expect(
    page.getByText('日程を調整している卓はありません'),
  ).toBeVisible();
});
