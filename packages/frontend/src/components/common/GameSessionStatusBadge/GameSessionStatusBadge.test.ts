// このファイルを編集するときは README の「単体テスト項目」も更新が必要か確認してください。
// → ./README.md

import { describe, it, expect } from 'vitest';
import { mount } from '@vue/test-utils';
import { GameSessionStatus } from '@taku-biyori/shared';
import GameSessionStatusBadge from '@/components/common/GameSessionStatusBadge/GameSessionStatusBadge.vue';

describe('GameSessionStatusBadge', () => {
  describe('レンダリング', () => {
    it('デフォルト props でレンダリングされる', () => {
      // Arrange & Act
      const wrapper = mount(GameSessionStatusBadge, {
        props: { status: GameSessionStatus.scheduled },
      });

      // Assert
      expect(wrapper.find('.status-badge').exists()).toBe(true);
    });
  });

  describe('ラベル', () => {
    it.each([
      [GameSessionStatus.scheduled, '開催予定'],
      [GameSessionStatus.today, '本日開催'],
      [GameSessionStatus.completed, '完了'],
      [GameSessionStatus.cancelled, '中止'],
    ] as const)(
      'status="%s" のとき "%s" と表示される',
      (status, expectedLabel) => {
        // Arrange & Act
        const wrapper = mount(GameSessionStatusBadge, { props: { status } });

        // Assert
        expect(wrapper.find('.status-badge').text()).toBe(expectedLabel);
      },
    );
  });

  describe('バリアント', () => {
    it.each([
      [GameSessionStatus.scheduled, 'status-badge--success'],
      [GameSessionStatus.today, 'status-badge--error'],
      [GameSessionStatus.completed, 'status-badge--muted'],
      [GameSessionStatus.cancelled, 'status-badge--error'],
    ] as const)(
      'status="%s" のとき %s クラスが付与される',
      (status, className) => {
        // Arrange & Act
        const wrapper = mount(GameSessionStatusBadge, { props: { status } });

        // Assert
        expect(wrapper.find('.status-badge').classes()).toContain(className);
      },
    );
  });
});
