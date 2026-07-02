// このファイルを編集するときは README の「単体テスト項目」も更新が必要か確認してください。
// → ./README.md

import { describe, it, expect } from 'vitest';
import { mount } from '@vue/test-utils';
import PageContainer from '@/components/layout/PageContainer/PageContainer.vue';

describe('PageContainer', () => {
  describe('レンダリング', () => {
    it('デフォルト props でレンダリングされる', () => {
      // Arrange & Act
      const wrapper = mount(PageContainer, {
        slots: { default: 'コンテンツ' },
      });

      // Assert
      expect(wrapper.find('.page-container').exists()).toBe(true);
    });

    it('slot のコンテンツが表示される', () => {
      // Arrange & Act
      const wrapper = mount(PageContainer, {
        slots: { default: '<p>ページ本文</p>' },
      });

      // Assert
      expect(wrapper.find('.page-container').text()).toBe('ページ本文');
    });
  });

  describe('size', () => {
    it('デフォルトで .page-container--md クラスが付与される', () => {
      // Arrange & Act
      const wrapper = mount(PageContainer);

      // Assert
      expect(wrapper.find('.page-container').classes()).toContain(
        'page-container--md',
      );
    });

    it.each(['md', 'lg'] as const)(
      'size="%s" のとき .page-container--%s クラスが付与される',
      (size) => {
        // Arrange & Act
        const wrapper = mount(PageContainer, { props: { size } });

        // Assert
        expect(wrapper.find('.page-container').classes()).toContain(
          `page-container--${size}`,
        );
      },
    );
  });
});
