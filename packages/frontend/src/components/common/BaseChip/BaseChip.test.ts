// このファイルを編集するときは README の「単体テスト項目」も更新が必要か確認してください。
// → ./README.md

import { describe, it, expect } from 'vitest';
import { mount } from '@vue/test-utils';
import BaseChip from '@/components/common/BaseChip/BaseChip.vue';

describe('BaseChip', () => {
  describe('レンダリング', () => {
    it('デフォルト props でレンダリングされる', () => {
      // Arrange & Act
      const wrapper = mount(BaseChip, { slots: { default: 'フロントエンド' } });

      // Assert
      expect(wrapper.find('.chip').exists()).toBe(true);
      expect(wrapper.text()).toContain('フロントエンド');
    });
  });

  describe('selected', () => {
    it('selected=false のとき .chip--unselected クラスが付与される', () => {
      // Arrange & Act
      const wrapper = mount(BaseChip, { props: { selected: false } });

      // Assert
      expect(wrapper.find('.chip').classes()).toContain('chip--unselected');
      expect(wrapper.find('.chip').classes()).not.toContain('chip--selected');
    });

    it('selected=true のとき .chip--selected クラスが付与される', () => {
      // Arrange & Act
      const wrapper = mount(BaseChip, { props: { selected: true } });

      // Assert
      expect(wrapper.find('.chip').classes()).toContain('chip--selected');
      expect(wrapper.find('.chip').classes()).not.toContain('chip--unselected');
    });

    it('クリックしたとき update:selected イベントが発火し値が反転する', async () => {
      // Arrange
      const wrapper = mount(BaseChip, { props: { selected: false } });

      // Act
      await wrapper.trigger('click');

      // Assert
      expect(wrapper.emitted('update:selected')).toEqual([[true]]);
    });
  });

  describe('size', () => {
    it.each(['sm', 'md', 'lg'] as const)(
      'size="%s" のとき .chip--%s クラスが付与される',
      (size) => {
        // Arrange & Act
        const wrapper = mount(BaseChip, { props: { size } });

        // Assert
        expect(wrapper.find('.chip').classes()).toContain(`chip--${size}`);
      },
    );

    it('size を指定しないとき .chip--md クラスが付与される', () => {
      // Arrange & Act
      const wrapper = mount(BaseChip);

      // Assert
      expect(wrapper.find('.chip').classes()).toContain('chip--md');
    });
  });

  describe('removable', () => {
    it('removable=false のとき削除ボタンが表示されない', () => {
      // Arrange & Act
      const wrapper = mount(BaseChip, { props: { removable: false } });

      // Assert
      expect(wrapper.find('.chip__remove').exists()).toBe(false);
    });

    it('removable=true のとき削除ボタンが表示される', () => {
      // Arrange & Act
      const wrapper = mount(BaseChip, { props: { removable: true } });

      // Assert
      expect(wrapper.find('.chip__remove').exists()).toBe(true);
    });

    it('削除ボタンをクリックしたとき remove イベントが発火する', async () => {
      // Arrange
      const wrapper = mount(BaseChip, { props: { removable: true } });

      // Act
      await wrapper.find('.chip__remove').trigger('click');

      // Assert
      expect(wrapper.emitted('remove')).toHaveLength(1);
    });
  });

  describe('disabled', () => {
    it('disabled=true のとき .chip--disabled クラスが付与される', () => {
      // Arrange & Act
      const wrapper = mount(BaseChip, { props: { disabled: true } });

      // Assert
      expect(wrapper.find('.chip').classes()).toContain('chip--disabled');
    });

    it('disabled=true のときクリックしても update:selected イベントが発火しない', async () => {
      // Arrange
      const wrapper = mount(BaseChip, {
        props: { disabled: true, selected: false },
      });

      // Act
      await wrapper.trigger('click');

      // Assert
      expect(wrapper.emitted('update:selected')).toBeUndefined();
    });
  });

  describe('アクセシビリティ', () => {
    it('role="button" が付与されている', () => {
      // Arrange & Act
      const wrapper = mount(BaseChip);

      // Assert
      expect(wrapper.find('[role="button"]').exists()).toBe(true);
    });

    it('selected=false のとき aria-pressed="false" が付与される', () => {
      // Arrange & Act
      const wrapper = mount(BaseChip, { props: { selected: false } });

      // Assert
      expect(wrapper.find('.chip').attributes('aria-pressed')).toBe('false');
    });

    it('selected=true のとき aria-pressed="true" が付与される', () => {
      // Arrange & Act
      const wrapper = mount(BaseChip, { props: { selected: true } });

      // Assert
      expect(wrapper.find('.chip').attributes('aria-pressed')).toBe('true');
    });

    it('disabled=true のとき tabindex="-1" が付与される', () => {
      // Arrange & Act
      const wrapper = mount(BaseChip, { props: { disabled: true } });

      // Assert
      expect(wrapper.find('.chip').attributes('tabindex')).toBe('-1');
    });

    it('removable=true のとき削除ボタンに aria-label が付与されている', () => {
      // Arrange & Act
      const wrapper = mount(BaseChip, { props: { removable: true } });

      // Assert
      expect(
        wrapper.find('.chip__remove').attributes('aria-label'),
      ).toBeTruthy();
    });
  });
});
