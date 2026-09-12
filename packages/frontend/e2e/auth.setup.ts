import { test as setup, expect } from '@playwright/test';
import { AUTH_STATE_PATH, HOST_USERNAME, SEED_PASSWORD } from './fixtures';

/**
 * ログインを1回だけ通し、以降のテストが使い回すセッションを保存する。
 * ログイン画面そのものの検証もここが兼ねる。
 */
setup('ユーザーIDとパスワードでログインできる', async ({ page }) => {
  await page.goto('/login');

  // 「新規作成」タブの入力欄も同時に DOM にあるため、ログインタブに絞る
  const panel = page.getByRole('tabpanel', { name: 'ログイン' });
  await panel.locator('input[autocomplete="username"]').fill(HOST_USERNAME);
  await panel
    .locator('input[autocomplete="current-password"]')
    .fill(SEED_PASSWORD);
  await page.getByRole('button', { name: 'ログイン', exact: true }).click();

  await expect(page).toHaveURL(/\/dashboard/, { timeout: 15000 });

  await page.context().storageState({ path: AUTH_STATE_PATH });
});
