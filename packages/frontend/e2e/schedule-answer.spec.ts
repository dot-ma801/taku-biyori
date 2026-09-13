import { test, expect } from '@playwright/test';
import { RECRUITING_LOBBY_TITLE, candidateDateLabel } from './fixtures';

/** 「あなた」列のセルは ◯ → △ → ✕ の順に切り替わる */
const NEXT_ANSWER = {
  参加できる: '調整できる',
  調整できる: '不可',
  不可: '参加できる',
};

test('日程の回答を切り替えると、保存後の表に残る', async ({ page }) => {
  await page.goto('/game-sessions');
  await page
    .getByRole('link', { name: `${RECRUITING_LOBBY_TITLE} を開く` })
    .click();
  await page.getByRole('tab', { name: '日程調整' }).click();

  // シードは3つ目の候補日（21日後）にホストの「調整できる」を入れている
  const targetDate = candidateDateLabel(21);
  const row = page.getByRole('row').filter({ hasText: targetDate });
  await expect(
    row.getByRole('cell', { name: '調整できる' }).first(),
  ).toBeVisible();

  await page.getByRole('button', { name: '回答を編集する' }).click();
  await row.getByRole('button').first().click();
  await expect(row.getByRole('button').first()).toHaveAccessibleName(
    NEXT_ANSWER.調整できる,
  );

  await page.getByRole('button', { name: '完了' }).click();

  // 保存が終わると編集モードが閉じる。待たずに reload すると送信が中断される
  await expect(
    page.getByRole('button', { name: '回答を編集する' }),
  ).toBeVisible();

  // 読み込み直しても保存されている
  await page.reload();
  await page.getByRole('tab', { name: '日程調整' }).click();
  await expect(
    page
      .getByRole('row')
      .filter({ hasText: targetDate })
      .getByRole('cell', { name: '不可' })
      .first(),
  ).toBeVisible();
});
