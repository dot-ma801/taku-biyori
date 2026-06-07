// このファイルを編集するときは README の「単体テスト項目」も更新が必要か確認してください。
// → ./README.md

import { describe, it, expect } from 'vitest';
import { mount } from '@vue/test-utils';
import BaseDatePicker from './BaseDatePicker.vue';

describe('BaseDatePicker', () => {
  describe('レンダリング', () => {
    it('デフォルト props でレンダリングされる', () => {
      // Arrange & Act
      const wrapper = mount(BaseDatePicker);

      // Assert
      expect(wrapper.find('.datepicker').exists()).toBe(true);
    });

    it('label が表示される', () => {
      // Arrange & Act
      const wrapper = mount(BaseDatePicker, {
        props: { label: '開催日' },
      });

      // Assert
      expect(wrapper.find('.datepicker__label').text()).toBe('開催日');
    });

    it('label が未指定のとき label 要素が表示されない', () => {
      // Arrange & Act
      const wrapper = mount(BaseDatePicker);

      // Assert
      expect(wrapper.find('.datepicker__label').exists()).toBe(false);
    });
  });

  describe('トリガーボタン', () => {
    it('値未選択のときプレースホルダーが表示される', () => {
      // Arrange & Act
      const wrapper = mount(BaseDatePicker, {
        props: { placeholder: '日付を選択' },
      });

      // Assert
      expect(
        wrapper.find('.datepicker__trigger-text--placeholder').exists(),
      ).toBe(true);
      expect(wrapper.find('.datepicker__trigger-text').text()).toBe(
        '日付を選択',
      );
    });

    it('値が選択済みのとき日付ラベルが表示される', () => {
      // Arrange & Act
      const wrapper = mount(BaseDatePicker, {
        props: { modelValue: '2025-06-15' },
      });

      // Assert
      expect(wrapper.find('.datepicker__trigger-text').text()).toBe(
        '2025/6/15',
      );
      expect(
        wrapper.find('.datepicker__trigger-text--placeholder').exists(),
      ).toBe(false);
    });
  });

  describe('multiple', () => {
    it('multiple=true のとき複数日選択でカウントラベルが表示される', () => {
      // Arrange & Act
      const wrapper = mount(BaseDatePicker, {
        props: {
          multiple: true,
          modelValue: ['2025-06-10', '2025-06-15', '2025-06-20'],
        },
      });

      // Assert
      expect(wrapper.find('.datepicker__trigger-text').text()).toBe(
        '3件選択中',
      );
    });

    it('multiple=true で1件のみ選択のとき日付ラベルが表示される', () => {
      // Arrange & Act
      const wrapper = mount(BaseDatePicker, {
        props: {
          multiple: true,
          modelValue: ['2025-06-10'],
        },
      });

      // Assert
      expect(wrapper.find('.datepicker__trigger-text').text()).toBe(
        '2025/6/10',
      );
    });
  });

  describe('disabled', () => {
    it('disabled のときトリガーボタンが無効化される', () => {
      // Arrange & Act
      const wrapper = mount(BaseDatePicker, {
        props: { disabled: true },
      });

      // Assert
      expect(
        wrapper.find('.datepicker__trigger').attributes('disabled'),
      ).toBeDefined();
    });
  });

  describe('アクセシビリティ', () => {
    it('トリガーボタンに aria-label が付与されている', () => {
      // Arrange & Act
      const wrapper = mount(BaseDatePicker, {
        props: { label: '開催日' },
      });

      // Assert
      expect(
        wrapper.find('.datepicker__trigger').attributes('aria-label'),
      ).toBe('開催日');
    });

    it('label 未指定でもトリガーボタンに aria-label が付与されている', () => {
      // Arrange & Act
      const wrapper = mount(BaseDatePicker);

      // Assert
      expect(
        wrapper.find('.datepicker__trigger').attributes('aria-label'),
      ).toBeTruthy();
    });
  });
});
