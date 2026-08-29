// このファイルを編集するときは README の「単体テスト項目」も更新が必要か確認してください。
// → ./README.md

import { describe, it, expect } from 'vitest';
import { mount } from '@vue/test-utils';
import { LobbyStatus } from '@taku-biyori/shared';
import LobbyStatusBadge from '@/components/common/LobbyStatusBadge/LobbyStatusBadge.vue';

describe('LobbyStatusBadge', () => {
  describe('レンダリング', () => {
    it('デフォルト props でレンダリングされる', () => {
      // Arrange & Act
      const wrapper = mount(LobbyStatusBadge, {
        props: { status: LobbyStatus.open },
      });

      // Assert
      expect(wrapper.find('.status-badge').exists()).toBe(true);
    });
  });

  describe('ラベル', () => {
    it.each([
      [LobbyStatus.draft, '非公開'],
      [LobbyStatus.open, '募集中'],
      [LobbyStatus.closed, '受付終了'],
      [LobbyStatus.disbanded, '解散'],
    ] as const)(
      'status="%s" のとき "%s" と表示される',
      (status, expectedLabel) => {
        // Arrange & Act
        const wrapper = mount(LobbyStatusBadge, { props: { status } });

        // Assert
        expect(wrapper.find('.status-badge').text()).toBe(expectedLabel);
      },
    );
  });

  describe('バリアント', () => {
    it.each([
      [LobbyStatus.draft, 'status-badge--muted'],
      [LobbyStatus.open, 'status-badge--primary'],
      [LobbyStatus.closed, 'status-badge--warning'],
      [LobbyStatus.disbanded, 'status-badge--error'],
    ] as const)(
      'status="%s" のとき %s クラスが付与される',
      (status, className) => {
        // Arrange & Act
        const wrapper = mount(LobbyStatusBadge, { props: { status } });

        // Assert
        expect(wrapper.find('.status-badge').classes()).toContain(className);
      },
    );
  });
});
