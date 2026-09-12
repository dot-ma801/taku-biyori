import type { Page } from '@playwright/test';

/**
 * シード（`packages/backend/scripts/seed.ts`）が作るデータのうち、e2e が名指しするもの。
 * シードを変えたらここも直す。
 */
export const SEED_PASSWORD = 'seed-password-1234';

/** 5つのロビーをホストしているユーザー */
export const HOST_USERNAME = 'yuki';

/** 公開・募集中のロビー。候補日3件・回答9件を持つ */
export const RECRUITING_LOBBY_TITLE = 'マダミス「霧の館」を遊びたい';

/** 開催予定の開催を持つロビー */
export const SCHEDULED_LOBBY_TITLE = 'TRPG「はじめての探索」';

export const AUTH_STATE_PATH = 'e2e/.auth/user.json';

/**
 * 開いているカレンダーから「今日から days 日後」を選ぶ。
 * 月をまたぐ場合は次の月へ送る（days は31未満を前提にしている）。
 */
export const pickDateAhead = async (page: Page, days: number) => {
  const target = new Date();
  target.setDate(target.getDate() + days);
  const iso = [
    target.getFullYear(),
    String(target.getMonth() + 1).padStart(2, '0'),
    String(target.getDate()).padStart(2, '0'),
  ].join('-');

  const cell = page.getByRole('gridcell', { name: iso });
  if ((await cell.count()) === 0) {
    await page.getByRole('button', { name: '次の月' }).click();
  }
  await cell.click();

  return iso;
};
