// このファイルを編集するときは README の「単体テスト項目」も更新が必要か確認してください。
// → ./README.md

import { describe, it, expect, vi } from 'vitest';
import { mount } from '@vue/test-utils';
import BaseButton from '@/components/button/BaseButton.vue';

describe('BaseButton', () => {
  describe('レンダリング', () => {
    it('デフォルト props でレンダリングされる', () => {
      // Arrange & Act
      const wrapper = mount(BaseButton, { slots: { default: 'クリック' } });

      // Assert
      expect(wrapper.find('button').exists()).toBe(true);
      expect(wrapper.text()).toBe('クリック');
    });

    it('スロットのテキストが表示される', () => {
      // Arrange & Act
      const wrapper = mount(BaseButton, { slots: { default: '保存' } });

      // Assert
      expect(wrapper.text()).toBe('保存');
    });
  });

  describe('variant', () => {
    it.each(['primary', 'secondary', 'ghost', 'danger'] as const)(
      'variant="%s" のとき .btn--%s クラスが付与される',
      (variant) => {
        // Arrange & Act
        const wrapper = mount(BaseButton, { props: { variant } });

        // Assert
        expect(wrapper.find('button').classes()).toContain(`btn--${variant}`);
      },
    );
  });

  describe('size', () => {
    it.each(['sm', 'md', 'lg'] as const)(
      'size="%s" のとき .btn--%s クラスが付与される',
      (size) => {
        // Arrange & Act
        const wrapper = mount(BaseButton, { props: { size } });

        // Assert
        expect(wrapper.find('button').classes()).toContain(`btn--${size}`);
      },
    );
  });

  describe('disabled', () => {
    it('disabled=true のとき disabled 属性が付与される', () => {
      // Arrange & Act
      const wrapper = mount(BaseButton, { props: { disabled: true } });

      // Assert
      expect(wrapper.find('button').element.disabled).toBe(true);
    });

    it('disabled=false のとき disabled 属性が付与されない', () => {
      // Arrange & Act
      const wrapper = mount(BaseButton, { props: { disabled: false } });

      // Assert
      expect(wrapper.find('button').element.disabled).toBe(false);
    });
  });

  describe('loading', () => {
    it('loading=true のときスピナー要素が表示される', () => {
      // Arrange & Act
      const wrapper = mount(BaseButton, { props: { loading: true } });

      // Assert
      expect(wrapper.find('.btn__spinner').exists()).toBe(true);
    });

    it('loading=true のとき disabled 属性が付与される', () => {
      // Arrange & Act
      const wrapper = mount(BaseButton, { props: { loading: true } });

      // Assert
      expect(wrapper.find('button').element.disabled).toBe(true);
    });

    it('loading=true のとき aria-busy="true" が付与される', () => {
      // Arrange & Act
      const wrapper = mount(BaseButton, { props: { loading: true } });

      // Assert
      expect(wrapper.find('button').attributes('aria-busy')).toBe('true');
    });

    it('loading=false のときスピナーが非表示でスロットが表示される', () => {
      // Arrange & Act
      const wrapper = mount(BaseButton, {
        props: { loading: false },
        slots: { default: 'ラベル' },
      });

      // Assert
      expect(wrapper.find('.btn__spinner').exists()).toBe(false);
      expect(wrapper.text()).toBe('ラベル');
    });
  });

  describe('type', () => {
    it.each(['button', 'submit', 'reset'] as const)(
      'type="%s" のとき button の type 属性が "%s" になる',
      (type) => {
        // Arrange & Act
        const wrapper = mount(BaseButton, { props: { type } });

        // Assert
        expect(wrapper.find('button').attributes('type')).toBe(type);
      },
    );
  });

  describe('イベント', () => {
    it('クリック時にクリックイベントが伝播する', async () => {
      // Arrange
      const onClick = vi.fn();
      const wrapper = mount(BaseButton, { attrs: { onClick } });

      // Act
      await wrapper.trigger('click');

      // Assert
      expect(onClick).toHaveBeenCalledOnce();
    });
  });

  describe('アクセシビリティ', () => {
    it('loading=false のとき aria-busy 属性が付与されない', () => {
      // Arrange & Act
      const wrapper = mount(BaseButton, { props: { loading: false } });

      // Assert
      expect(wrapper.find('button').attributes('aria-busy')).toBeUndefined();
    });
  });
});
