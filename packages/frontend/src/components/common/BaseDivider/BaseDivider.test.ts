// このファイルを編集するときは README の「単体テスト項目」も更新が必要か確認してください。
// → ./README.md

import { describe, it, expect } from 'vitest';
import { mount } from '@vue/test-utils';
import BaseDivider from '@/components/common/BaseDivider/BaseDivider.vue';

describe('BaseDivider', () => {
  describe('レンダリング', () => {
    it('デフォルト props で水平区切り線がレンダリングされる', () => {
      // Arrange & Act
      const wrapper = mount(BaseDivider);

      // Assert
      expect(wrapper.find('hr.divider').exists()).toBe(true);
    });
  });

  describe('label', () => {
    it('label prop がないとき .divider__label が表示されない', () => {
      // Arrange & Act
      const wrapper = mount(BaseDivider);

      // Assert
      expect(wrapper.find('.divider__label').exists()).toBe(false);
    });

    it('label prop を渡したときテキストが中央に表示される', () => {
      // Arrange & Act
      const wrapper = mount(BaseDivider, { props: { label: 'または' } });

      // Assert
      expect(wrapper.find('.divider__label').text()).toBe('または');
    });

    it('label があるとき <div> ラッパーでレンダリングされる（<hr> ではない）', () => {
      // Arrange & Act
      const wrapper = mount(BaseDivider, { props: { label: 'または' } });

      // Assert
      expect(wrapper.find('hr').exists()).toBe(false);
      expect(wrapper.find('.divider--labeled').exists()).toBe(true);
    });
  });

  describe('vertical', () => {
    it('vertical=false のとき .divider--vertical クラスが付与されない', () => {
      // Arrange & Act
      const wrapper = mount(BaseDivider, { props: { vertical: false } });

      // Assert
      expect(wrapper.find('.divider').classes()).not.toContain(
        'divider--vertical',
      );
    });

    it('vertical=true のとき .divider--vertical クラスが付与される', () => {
      // Arrange & Act
      const wrapper = mount(BaseDivider, { props: { vertical: true } });

      // Assert
      expect(wrapper.find('.divider--vertical').exists()).toBe(true);
    });
  });

  describe('アクセシビリティ', () => {
    it('ラベルなし区切り線に role="separator" が付与されている', () => {
      // Arrange & Act
      const wrapper = mount(BaseDivider);

      // Assert
      expect(wrapper.find('[role="separator"]').exists()).toBe(true);
    });

    it('ラベルあり区切り線にも role="separator" が付与されている', () => {
      // Arrange & Act
      const wrapper = mount(BaseDivider, { props: { label: 'または' } });

      // Assert
      expect(wrapper.find('[role="separator"]').exists()).toBe(true);
    });
  });
});
