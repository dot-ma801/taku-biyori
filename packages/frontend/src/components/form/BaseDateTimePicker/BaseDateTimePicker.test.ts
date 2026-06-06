// このファイルを編集するときは README の「単体テスト項目」も更新が必要か確認してください。
// → ./README.md

import { describe, it, expect } from 'vitest';
import { mount } from '@vue/test-utils';
import BaseDateTimePicker from './BaseDateTimePicker.vue';

describe('BaseDateTimePicker', () => {
  describe('レンダリング', () => {
    it('デフォルト props でレンダリングされる', () => {
      // Arrange & Act
      const wrapper = mount(BaseDateTimePicker);

      // Assert
      expect(wrapper.find('.datetimepicker').exists()).toBe(true);
    });

    it('label が表示される', () => {
      // Arrange & Act
      const wrapper = mount(BaseDateTimePicker, {
        props: { label: '開催日時' },
      });

      // Assert
      expect(wrapper.find('.datetimepicker__label').text()).toBe('開催日時');
    });

    it('label が未指定のとき label 要素が表示されない', () => {
      // Arrange & Act
      const wrapper = mount(BaseDateTimePicker);

      // Assert
      expect(wrapper.find('.datetimepicker__label').exists()).toBe(false);
    });
  });

  describe('input type', () => {
    it('input の type が datetime-local になっている', () => {
      // Arrange & Act
      const wrapper = mount(BaseDateTimePicker);

      // Assert
      expect(wrapper.find('input').attributes('type')).toBe('datetime-local');
    });
  });

  describe('hint', () => {
    it('hint が指定されたとき表示される', () => {
      // Arrange & Act
      const wrapper = mount(BaseDateTimePicker, {
        props: { hint: '日時を入力してください' },
      });

      // Assert
      expect(wrapper.find('.datetimepicker__hint').text()).toBe(
        '日時を入力してください',
      );
    });

    it('hint が未指定のとき hint 要素が表示されない', () => {
      // Arrange & Act
      const wrapper = mount(BaseDateTimePicker);

      // Assert
      expect(wrapper.find('.datetimepicker__hint').exists()).toBe(false);
    });
  });

  describe('disabled', () => {
    it('disabled のとき input が無効化される', () => {
      // Arrange & Act
      const wrapper = mount(BaseDateTimePicker, {
        props: { disabled: true },
      });

      // Assert
      expect(wrapper.find('input').attributes('disabled')).toBeDefined();
    });
  });

  describe('アクセシビリティ', () => {
    it('input 要素が存在する', () => {
      // Arrange & Act
      const wrapper = mount(BaseDateTimePicker);

      // Assert
      expect(wrapper.find('input').exists()).toBe(true);
    });
  });
});
