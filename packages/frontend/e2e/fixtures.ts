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

/** 募集中のロビーの招待トークン（シードで固定している） */
export const RECRUITING_LOBBY_GUEST_TOKEN = 'seed-lobby-open';

/** 募集中のロビーにまだ参加していないユーザー */
export const NOT_JOINED_USERNAME = 'aki';

/** 開催予定の開催を持つロビー */
export const SCHEDULED_LOBBY_TITLE = 'TRPG「はじめての探索」';

export const AUTH_STATE_PATH = 'e2e/.auth/user.json';

/**
 * シードの候補日（`dateFromToday(offsetDays)`）を画面表示と同じ "M/D" で返す。
 * 日付を決め打ちすると実行日が変わった途端に対象行が消えるため、シードと同じ基準で導出する。
 */
export const candidateDateLabel = (offsetDays: number): string => {
  const target = new Date();
  target.setDate(target.getDate() + offsetDays);
  return `${target.getMonth() + 1}/${target.getDate()}`;
};

/** ユーザーIDとパスワードでログインし、ダッシュボードに着くまで待つ */
export const loginAs = async (page: Page, username: string) => {
  await page.goto('/login');
  // 「新規作成」タブの入力欄も同時に DOM にあるため、ログインタブに絞る
  const panel = page.getByRole('tabpanel', { name: 'ログイン' });
  await panel.locator('input[autocomplete="username"]').fill(username);
  await panel
    .locator('input[autocomplete="current-password"]')
    .fill(SEED_PASSWORD);
  await page.getByRole('button', { name: 'ログイン', exact: true }).click();
  await page.waitForURL(/\/dashboard/, { timeout: 15000 });
};

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
