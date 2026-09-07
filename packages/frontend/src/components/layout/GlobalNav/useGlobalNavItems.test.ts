import { describe, it, expect } from 'vitest';
import { PAGE_NAME } from '@/config/pageName';
import { toGlobalNavItemViews } from '@/components/layout/GlobalNav/useGlobalNavItems';

describe('toGlobalNavItemViews', () => {
  describe('項目', () => {
    it('ダッシュボードとマイページの2項目を返す', () => {
      // Arrange & Act
      const items = toGlobalNavItemViews(PAGE_NAME.dashboard);

      // Assert
      expect(items.map((i) => i.id)).toEqual(['dashboard', 'profile']);
    });
  });

  describe('現在地の判定', () => {
    it.each([
      PAGE_NAME.dashboard,
      PAGE_NAME.lobbiesDetail,
      PAGE_NAME.lobbiesNew,
      PAGE_NAME.lobbiesEdit,
      PAGE_NAME.gameSessionsDetail,
      PAGE_NAME.gameSessionsEdit,
      PAGE_NAME.gameSessionsPlayMemo,
    ])('卓配下の "%s" ではダッシュボードが現在地になる', (page) => {
      // Arrange & Act
      const items = toGlobalNavItemViews(page);

      // Assert
      expect(items[0]?.isCurrent).toBe(true);
      expect(items[1]?.isCurrent).toBe(false);
    });

    it('profile-setting ではマイページが現在地になる', () => {
      // Arrange & Act
      const items = toGlobalNavItemViews(PAGE_NAME.profileSetting);

      // Assert
      expect(items[0]?.isCurrent).toBe(false);
      expect(items[1]?.isCurrent).toBe(true);
    });

    it.each([PAGE_NAME.login, PAGE_NAME.top, PAGE_NAME.authCallback])(
      'シェル外の "%s" ではどの項目も現在地にならない',
      (page) => {
        // Arrange & Act
        const items = toGlobalNavItemViews(page);

        // Assert
        expect(items.every((i) => !i.isCurrent)).toBe(true);
      },
    );

    it('現在地が未確定（null）のときはどの項目も現在地にならない', () => {
      // Arrange & Act
      const items = toGlobalNavItemViews(null);

      // Assert
      expect(items.every((i) => !i.isCurrent)).toBe(true);
    });
  });

  describe('aria-current', () => {
    it('現在地の項目だけ "page" を持ち、他は undefined になる', () => {
      // Arrange & Act
      const items = toGlobalNavItemViews(PAGE_NAME.dashboard);

      // Assert
      expect(items[0]?.ariaCurrent).toBe('page');
      expect(items[1]?.ariaCurrent).toBeUndefined();
    });
  });

  describe('現在地が変わったとき', () => {
    it('渡した画面が変われば現在地の項目も入れ替わる', () => {
      // Arrange & Act
      const onDashboard = toGlobalNavItemViews(PAGE_NAME.dashboard);
      const onProfile = toGlobalNavItemViews(PAGE_NAME.profileSetting);

      // Assert
      expect(onDashboard[0]?.isCurrent).toBe(true);
      expect(onProfile[0]?.isCurrent).toBe(false);
      expect(onProfile[1]?.isCurrent).toBe(true);
    });
  });
});
