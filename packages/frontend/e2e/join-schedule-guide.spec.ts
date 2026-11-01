import { test, expect, type Browser, type Page } from '@playwright/test';
import {
  NOT_JOINED_USERNAME,
  RECRUITING_LOBBY_GUEST_TOKEN,
  RECRUITING_LOBBY_TITLE,
  loginAs,
} from './fixtures';

/** LINE 内蔵ブラウザを想定したスマホ幅 */
const MOBILE_VIEWPORT = { width: 375, height: 667 };

/** ホストのセッションで一覧から卓を開き、その URL を返す */
const recruitingLobbyPath = async (page: Page): Promise<string> => {
  await page.goto('/game-sessions');
  await page
    .getByRole('link', { name: `${RECRUITING_LOBBY_TITLE} を開く` })
    .click();
  await page.waitForURL(/\/lobbies\/[^/]+$/);
  return new URL(page.url()).pathname;
};

/** ログインしていないスマホ幅のページを開く */
const newMobilePage = async (browser: Browser): Promise<Page> => {
  const context = await browser.newContext({
    viewport: MOBILE_VIEWPORT,
    storageState: { cookies: [], origins: [] },
  });
  return context.newPage();
};

/** 参加直後の案内を確かめ、そこから ◯△× を全部付けて保存する。案内の locator を返す */
const answerFromGuide = async (page: Page) => {
  await expect(page.getByRole('tab', { name: '日程調整' })).toHaveAttribute(
    'aria-selected',
    'true',
  );
  const guide = page.getByRole('alert').filter({ hasText: '参加ありがとう' });
  await expect(guide).toBeVisible();
  await expect(page.getByText('未回答', { exact: true }).first()).toBeVisible();

  await guide.getByRole('button', { name: '◯△× を付ける' }).click();
  const myAnswers = page.getByRole('button', { name: /あなたの回答/ });
  const count = await myAnswers.count();
  expect(count).toBeGreaterThan(0);
  for (let i = 0; i < count; i++) {
    await myAnswers.nth(i).click();
  }
  await page.getByRole('button', { name: '完了' }).click();
  return guide;
};

test.describe('参加直後に日程調整へ案内する（スマホ幅）', () => {
  test('ログインユーザーが参加すると、日程調整タブで回答を促される', async ({
    page,
    browser,
  }) => {
    const path = await recruitingLobbyPath(page);
    const mobile = await newMobilePage(browser);
    await loginAs(mobile, NOT_JOINED_USERNAME);

    await mobile.goto(path);
    await mobile.getByRole('button', { name: '参加', exact: true }).click();

    const guide = await answerFromGuide(mobile);

    // 保存が終わって自分の回答が埋まると案内が消える
    await expect(guide).toBeHidden();
    await expect(mobile.getByText('未回答', { exact: true })).toHaveCount(0);
  });

  test('ゲストが参加すると、日程調整タブで自分の列に回答を促される', async ({
    page,
    browser,
  }) => {
    const path = await recruitingLobbyPath(page);
    const mobile = await newMobilePage(browser);

    await mobile.goto(`${path}?token=${RECRUITING_LOBBY_GUEST_TOKEN}`);
    await mobile.getByRole('button', { name: '参加', exact: true }).click();
    await mobile.getByRole('dialog').getByRole('textbox').fill('e2e ゲスト');
    await mobile.getByRole('button', { name: '参加する' }).click();

    const guide = await answerFromGuide(mobile);

    // 保存が終わって自分の回答が埋まると案内が消える
    await expect(guide).toBeHidden();
    await expect(mobile.getByText('未回答', { exact: true })).toHaveCount(0);
  });
});
