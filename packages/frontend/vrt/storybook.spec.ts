import { readFileSync } from 'node:fs';
import path from 'node:path';
import { expect, test } from '@playwright/test';

/**
 * Storybook の全 story を light / dark 両テーマで撮る視覚回帰テスト。
 *
 * UI 移行では「意図した変化」と「巻き込み事故」を区別できることが最優先なので、
 * 画面（features / views）ではなくコンポーネント単位で押さえている。
 * 画面はレイアウト・情報設計ごと変わる予定で、差分が全面的になり判定に使えないため。
 */

type StorybookIndex = {
  entries: Record<
    string,
    { id: string; title: string; name: string; type: string }
  >;
};

const THEMES = ['light', 'dark'] as const;

const indexPath = path.resolve(
  import.meta.dirname,
  '../storybook-static/index.json',
);

const loadStories = () => {
  let raw: string;
  try {
    raw = readFileSync(indexPath, 'utf8');
  } catch {
    throw new Error(
      `${indexPath} が見つかりません。先に \`pnpm --filter @taku-biyori/frontend build-storybook\` を実行してください。`,
    );
  }

  const index = JSON.parse(raw) as StorybookIndex;
  return Object.values(index.entries)
    .filter((entry) => entry.type === 'story')
    .sort((a, b) => a.id.localeCompare(b.id));
};

for (const story of loadStories()) {
  for (const theme of THEMES) {
    test(`${story.id} (${theme})`, async ({ page }) => {
      await page.goto(
        `/iframe.html?id=${encodeURIComponent(story.id)}&viewMode=story&globals=theme:${theme}`,
      );

      const root = page.locator('#vrt-root');
      await root.waitFor({ state: 'visible' });
      // Webフォントの適用前に撮ると差分が安定しない
      await page.evaluate(() => document.fonts.ready);

      await expect(root).toHaveScreenshot(`${story.id}--${theme}.png`);
    });
  }
}
