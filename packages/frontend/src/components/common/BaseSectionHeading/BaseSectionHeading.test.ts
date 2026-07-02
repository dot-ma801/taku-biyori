// このファイルを編集するときは README の「単体テスト項目」も更新が必要か確認してください。
// → ./README.md

import { describe, it, expect } from 'vitest';
import { mount } from '@vue/test-utils';
import { NotebookPen } from '@lucide/vue';
import BaseSectionHeading from '@/components/common/BaseSectionHeading/BaseSectionHeading.vue';

describe('BaseSectionHeading', () => {
  describe('レンダリング', () => {
    it('デフォルト props でレンダリングされる', () => {
      // Arrange & Act
      const wrapper = mount(BaseSectionHeading, {
        slots: { default: '基本情報' },
      });

      // Assert
      expect(wrapper.find('.section-heading').exists()).toBe(true);
    });

    it('デフォルトで h2 要素としてレンダリングされる', () => {
      // Arrange & Act
      const wrapper = mount(BaseSectionHeading, {
        slots: { default: '基本情報' },
      });

      // Assert
      expect(wrapper.element.tagName.toLowerCase()).toBe('h2');
    });

    it('default スロットのテキストが表示される', () => {
      // Arrange & Act
      const wrapper = mount(BaseSectionHeading, {
        slots: { default: 'セクション見出し' },
      });

      // Assert
      expect(wrapper.text()).toContain('セクション見出し');
    });
  });

  describe('level', () => {
    it.each(['h1', 'h2', 'h3', 'h4', 'h5', 'h6'] as const)(
      'level="%s" のとき %s 要素としてレンダリングされる',
      (level) => {
        // Arrange & Act
        const wrapper = mount(BaseSectionHeading, {
          props: { level },
          slots: { default: '見出し' },
        });

        // Assert
        expect(wrapper.element.tagName.toLowerCase()).toBe(level);
      },
    );
  });

  describe('icon', () => {
    it('icon prop を渡したとき .section-heading__icon が表示される', () => {
      // Arrange & Act
      const wrapper = mount(BaseSectionHeading, {
        props: { icon: NotebookPen },
        slots: { default: '見出し' },
      });

      // Assert
      expect(wrapper.find('.section-heading__icon').exists()).toBe(true);
    });

    it('icon prop を渡したとき aria-hidden="true" が付与される', () => {
      // Arrange & Act
      const wrapper = mount(BaseSectionHeading, {
        props: { icon: NotebookPen },
        slots: { default: '見出し' },
      });

      // Assert
      expect(
        wrapper.find('.section-heading__icon').attributes('aria-hidden'),
      ).toBe('true');
    });

    it('icon prop がないとき .section-heading__icon が表示されない', () => {
      // Arrange & Act
      const wrapper = mount(BaseSectionHeading, {
        slots: { default: '見出し' },
      });

      // Assert
      expect(wrapper.find('.section-heading__icon').exists()).toBe(false);
    });
  });

  describe('iconColor', () => {
    it('iconColor="primary" のとき var(--color-primary) が適用される', () => {
      // Arrange & Act
      const wrapper = mount(BaseSectionHeading, {
        props: { icon: NotebookPen, iconColor: 'primary' },
        slots: { default: '見出し' },
      });

      // Assert
      expect(
        wrapper.find('.section-heading__icon').attributes('style'),
      ).toContain('var(--_icon-primary-color)');
    });

    it('iconColor="default" のとき currentColor が適用される', () => {
      // Arrange & Act
      const wrapper = mount(BaseSectionHeading, {
        props: { icon: NotebookPen, iconColor: 'default' },
        slots: { default: '見出し' },
      });

      // Assert
      expect(
        wrapper.find('.section-heading__icon').attributes('style'),
      ).toContain('currentcolor');
    });

    it('iconColor に任意の色文字列を渡したとき style に反映される', () => {
      // Arrange & Act
      const wrapper = mount(BaseSectionHeading, {
        props: { icon: NotebookPen, iconColor: '#ff0000' },
        slots: { default: '見出し' },
      });

      // Assert
      expect(
        wrapper.find('.section-heading__icon').attributes('style'),
      ).toContain('rgb(255, 0, 0)');
    });
  });
});
