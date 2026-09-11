import { describe, it, expect } from 'vitest';
import { PAGE_NAME } from '@/config/pageName';
import { toGlobalNavItemViews } from '@/components/layout/GlobalNav/useGlobalNavItems';

/** 現在地になっている項目の id。3項目あるので位置ではなく id で確かめる */
const currentIds = (page: Parameters<typeof toGlobalNavItemViews>[0]) =>
  toGlobalNavItemViews(page)
    .filter((i) => i.isCurrent)
    .map((i) => i.id);

describe('toGlobalNavItemViews', () => {
  describe('項目', () => {
    it('ダッシュボード・卓・マイページの3項目を返す', () => {
      // Arrange & Act
      const items = toGlobalNavItemViews(PAGE_NAME.dashboard);

      // Assert
      expect(items.map((i) => i.id)).toEqual([
        'dashboard',
        'game-sessions',
        'profile',
      ]);
    });
  });

  describe('現在地の判定', () => {
    it('dashboard ではダッシュボードが現在地になる', () => {
      // Arrange & Act & Assert
      expect(currentIds(PAGE_NAME.dashboard)).toEqual(['dashboard']);
    });

    it.each([
      PAGE_NAME.gameSessions,
      PAGE_NAME.lobbiesDetail,
      PAGE_NAME.lobbiesNew,
      PAGE_NAME.lobbiesEdit,
      PAGE_NAME.gameSessionsDetail,
      PAGE_NAME.gameSessionsEdit,
      PAGE_NAME.gameSessionsPlayMemo,
    ])('卓配下の "%s" では卓が現在地になる', (page) => {
      // Arrange & Act & Assert
      expect(currentIds(page)).toEqual(['game-sessions']);
    });

    it('profile-setting ではマイページが現在地になる', () => {
      // Arrange & Act & Assert
      expect(currentIds(PAGE_NAME.profileSetting)).toEqual(['profile']);
    });

    it.each([PAGE_NAME.login, PAGE_NAME.top, PAGE_NAME.authCallback])(
      'シェル外の "%s" ではどの項目も現在地にならない',
      (page) => {
        // Arrange & Act & Assert
        expect(currentIds(page)).toEqual([]);
      },
    );

    it('現在地が未確定（null）のときはどの項目も現在地にならない', () => {
      // Arrange & Act & Assert
      expect(currentIds(null)).toEqual([]);
    });
  });

  describe('aria-current', () => {
    it('現在地の項目だけ "page" を持ち、他は undefined になる', () => {
      // Arrange & Act
      const items = toGlobalNavItemViews(PAGE_NAME.dashboard);

      // Assert
      expect(items[0]?.ariaCurrent).toBe('page');
      expect(items[1]?.ariaCurrent).toBeUndefined();
      expect(items[2]?.ariaCurrent).toBeUndefined();
    });
  });

  describe('現在地が変わったとき', () => {
    it('渡した画面が変われば現在地の項目も入れ替わる', () => {
      // Arrange & Act & Assert
      expect(currentIds(PAGE_NAME.dashboard)).toEqual(['dashboard']);
      expect(currentIds(PAGE_NAME.profileSetting)).toEqual(['profile']);
    });
  });
});
