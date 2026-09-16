import { test, expect } from '@playwright/test';
import { pickDateAhead } from './fixtures';

test('卓を立てると詳細画面に出る', async ({ page }) => {
  const title = `e2e で立てた卓 ${Date.now()}`;

  await page.goto('/lobbies/new');

  await page
    .getByRole('textbox', { name: 'タイトル', exact: true })
    .fill(title);
  await page
    .getByRole('textbox', { name: 'シナリオタイトル', exact: true })
    .fill('e2e シナリオ');

  await page.getByRole('button', { name: '候補日', exact: true }).click();
  await pickDateAhead(page, 10);

  await page.getByRole('button', { name: 'ロビーを作成する' }).click();

  await expect(
    page.getByRole('heading', { name: title, level: 1 }),
  ).toBeVisible();
  await expect(page.getByText('e2e シナリオ')).toBeVisible();
});
