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
        props: { status: GameSessionStatus.confirmed },
      });

      // Assert
      expect(wrapper.find('.status-badge').exists()).toBe(true);
    });
  });

  describe('ラベル', () => {
    it.each([
      [GameSessionStatus.draft, '非公開'],
      [GameSessionStatus.confirmed, '実施前'],
      [GameSessionStatus.today, '当日'],
      [GameSessionStatus.completed, '通過済み'],
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
      [GameSessionStatus.draft, 'status-badge--muted'],
      [GameSessionStatus.confirmed, 'status-badge--success'],
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

  describe('卓では扱わないステータス', () => {
    it.each([GameSessionStatus.open] as const)(
      'status="%s"（募集枠へ移管）のときバッジを描画しない',
      (status) => {
        // Arrange & Act
        const wrapper = mount(GameSessionStatusBadge, { props: { status } });

        // Assert
        expect(wrapper.find('.status-badge').exists()).toBe(false);
      },
    );
  });
});
