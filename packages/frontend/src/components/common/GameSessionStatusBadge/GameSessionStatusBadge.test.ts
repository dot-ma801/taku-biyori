// このファイルを編集するときは README の「単体テスト項目」も更新が必要か確認してください。
// → ./README.md

import { describe, it, expect } from 'vitest';
import { mount } from '@vue/test-utils';
import { GameSessionStatus } from '@taku-biyori/shared';
import GameSessionStatusBadge from './GameSessionStatusBadge.vue';

describe('GameSessionStatusBadge', () => {
  describe('レンダリング', () => {
    it('デフォルト props でレンダリングされる', () => {
      // Arrange & Act
      const wrapper = mount(GameSessionStatusBadge, {
        props: { status: GameSessionStatus.open },
      });

      // Assert
      expect(wrapper.find('.status-badge').exists()).toBe(true);
    });
  });

  describe('ラベル', () => {
    it.each([
      [GameSessionStatus.draft, '非公開'],
      [GameSessionStatus.open, '募集中'],
      [GameSessionStatus.scheduling, '日程調整中'],
      [GameSessionStatus.confirmed, '実施前'],
      [GameSessionStatus.today, '当日'],
      [GameSessionStatus.completed, '通過済み'],
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
      [GameSessionStatus.draft, 'status-badge--muted'],
      [GameSessionStatus.open, 'status-badge--primary'],
      [GameSessionStatus.scheduling, 'status-badge--warning'],
      [GameSessionStatus.confirmed, 'status-badge--success'],
      [GameSessionStatus.today, 'status-badge--error'],
      [GameSessionStatus.completed, 'status-badge--muted'],
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
