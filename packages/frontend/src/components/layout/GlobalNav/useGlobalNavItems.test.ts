import { describe, it, expect } from 'vitest';
import { ref } from 'vue';
import { useGlobalNavItems } from '@/components/layout/GlobalNav/useGlobalNavItems';

describe('useGlobalNavItems', () => {
  describe('項目', () => {
    it('ダッシュボードとマイページの2項目を返す', () => {
      // Arrange & Act
      const { items } = useGlobalNavItems('dashboard');

      // Assert
      expect(items.value.map((i) => i.id)).toEqual(['dashboard', 'profile']);
    });
  });

  describe('現在地の判定', () => {
    it.each([
      'dashboard',
      'lobbies-detail',
      'lobbies-new',
      'lobbies-edit',
      'game-sessions-detail',
      'game-sessions-edit',
      'game-sessions-play-memo',
    ])('卓配下の "%s" ではダッシュボードが現在地になる', (routeName) => {
      // Arrange & Act
      const { items } = useGlobalNavItems(routeName);

      // Assert
      expect(items.value[0]?.isCurrent).toBe(true);
      expect(items.value[1]?.isCurrent).toBe(false);
    });

    it('profile-setting ではマイページが現在地になる', () => {
      // Arrange & Act
      const { items } = useGlobalNavItems('profile-setting');

      // Assert
      expect(items.value[0]?.isCurrent).toBe(false);
      expect(items.value[1]?.isCurrent).toBe(true);
    });

    it.each(['login', 'top', 'auth-callback'])(
      'シェル外の "%s" ではどの項目も現在地にならない',
      (routeName) => {
        // Arrange & Act
        const { items } = useGlobalNavItems(routeName);

        // Assert
        expect(items.value.every((i) => !i.isCurrent)).toBe(true);
      },
    );

    it('ルート名が未確定（null）のときはどの項目も現在地にならない', () => {
      // Arrange & Act
      const { items } = useGlobalNavItems(null);

      // Assert
      expect(items.value.every((i) => !i.isCurrent)).toBe(true);
    });
  });

  describe('aria-current', () => {
    it('現在地の項目だけ "page" を持ち、他は undefined になる', () => {
      // Arrange & Act
      const { items } = useGlobalNavItems('dashboard');

      // Assert
      expect(items.value[0]?.ariaCurrent).toBe('page');
      expect(items.value[1]?.ariaCurrent).toBeUndefined();
    });
  });

  describe('リアクティビティ', () => {
    it('ルート名が変わると現在地の項目が切り替わる', () => {
      // Arrange
      const routeName = ref('dashboard');
      const { items } = useGlobalNavItems(routeName);

      // Act
      routeName.value = 'profile-setting';

      // Assert
      expect(items.value[0]?.isCurrent).toBe(false);
      expect(items.value[1]?.isCurrent).toBe(true);
    });
  });
});
