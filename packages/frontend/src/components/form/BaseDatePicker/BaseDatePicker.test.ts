// このファイルを編集するときは README の「単体テスト項目」も更新が必要か確認してください。
// → ./README.md

import { describe, it, expect, vi, afterEach } from 'vitest';
import { mount } from '@vue/test-utils';
import BaseDatePicker from '@/components/form/BaseDatePicker/BaseDatePicker.vue';

afterEach(() => {
  vi.useRealTimers();
});

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

  describe('required', () => {
    it('required=true のときラベルに必須マークが表示される', () => {
      // Arrange & Act
      const wrapper = mount(BaseDatePicker, {
        props: { label: '開始日', required: true },
      });

      // Assert
      expect(wrapper.find('.datepicker__required').exists()).toBe(true);
    });

    it('required 未指定のとき必須マークが表示されない', () => {
      // Arrange & Act
      const wrapper = mount(BaseDatePicker, {
        props: { label: '開始日' },
      });

      // Assert
      expect(wrapper.find('.datepicker__required').exists()).toBe(false);
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

  describe('disablePast', () => {
    it('today より前の日付セルが disabled になる', () => {
      // Arrange
      vi.setSystemTime(new Date('2025-06-15T00:00:00'));
      const wrapper = mount(BaseDatePicker, {
        props: { disablePast: true },
      });

      // Act
      const pastCell = wrapper
        .findAll('.datepicker__cell')
        .find((c) => c.attributes('aria-label') === '2025-06-10');

      // Assert
      expect(pastCell?.attributes('disabled')).toBeDefined();
    });

    it('today 以降の日付セルは disabled にならない', () => {
      // Arrange
      vi.setSystemTime(new Date('2025-06-15T00:00:00'));
      const wrapper = mount(BaseDatePicker, {
        props: { disablePast: true },
      });

      // Act
      const futureCell = wrapper
        .findAll('.datepicker__cell')
        .find((c) => c.attributes('aria-label') === '2025-06-20');

      // Assert
      expect(futureCell?.attributes('disabled')).toBeUndefined();
    });

    it('disablePast 未指定なら過去日でも disabled にならない', () => {
      // Arrange
      vi.setSystemTime(new Date('2025-06-15T00:00:00'));
      const wrapper = mount(BaseDatePicker);

      // Act
      const pastCell = wrapper
        .findAll('.datepicker__cell')
        .find((c) => c.attributes('aria-label') === '2025-06-10');

      // Assert
      expect(pastCell?.attributes('disabled')).toBeUndefined();
    });
  });

  describe('clearable', () => {
    it('clearable=true かつ値が選択済みのときクリアボタンが表示される', () => {
      // Arrange & Act
      const wrapper = mount(BaseDatePicker, {
        props: { clearable: true, modelValue: '2025-06-15' },
      });

      // Assert
      expect(wrapper.find('.datepicker__clear').exists()).toBe(true);
    });

    it('clearable=true でも未選択のときはクリアボタンが表示されない', () => {
      // Arrange & Act
      const wrapper = mount(BaseDatePicker, {
        props: { clearable: true },
      });

      // Assert
      expect(wrapper.find('.datepicker__clear').exists()).toBe(false);
    });

    it('clearable 未指定のときはクリアボタンが表示されない', () => {
      // Arrange & Act
      const wrapper = mount(BaseDatePicker, {
        props: { modelValue: '2025-06-15' },
      });

      // Assert
      expect(wrapper.find('.datepicker__clear').exists()).toBe(false);
    });

    it('disabled のときはクリアボタンが表示されない', () => {
      // Arrange & Act
      const wrapper = mount(BaseDatePicker, {
        props: { clearable: true, disabled: true, modelValue: '2025-06-15' },
      });

      // Assert
      expect(wrapper.find('.datepicker__clear').exists()).toBe(false);
    });

    it('クリアボタンを押すと空文字が emit される', async () => {
      // Arrange
      const wrapper = mount(BaseDatePicker, {
        props: { clearable: true, modelValue: '2025-06-15' },
      });

      // Act
      await wrapper.find('.datepicker__clear').trigger('click');

      // Assert
      expect(wrapper.emitted('update:modelValue')?.[0]).toEqual(['']);
    });

    it('multiple=true でクリアボタンを押すと空配列が emit される', async () => {
      // Arrange
      const wrapper = mount(BaseDatePicker, {
        props: {
          clearable: true,
          multiple: true,
          modelValue: ['2025-06-10', '2025-06-15'],
        },
      });

      // Act
      await wrapper.find('.datepicker__clear').trigger('click');

      // Assert
      expect(wrapper.emitted('update:modelValue')?.[0]).toEqual([[]]);
    });

    it('クリアボタンはトリガーの外側に置かれる（押してもカレンダーが開かない）', () => {
      // Arrange & Act
      const wrapper = mount(BaseDatePicker, {
        props: { clearable: true, modelValue: '2025-06-15' },
      });

      // Assert
      expect(wrapper.find('.datepicker__clear').exists()).toBe(true);
      expect(
        wrapper.find('.datepicker__trigger .datepicker__clear').exists(),
      ).toBe(false);
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

    it('クリアボタンに aria-label が付与されている', () => {
      // Arrange & Act
      const wrapper = mount(BaseDatePicker, {
        props: {
          clearable: true,
          label: '募集締め切り日',
          modelValue: '2025-06-15',
        },
      });

      // Assert
      expect(wrapper.find('.datepicker__clear').attributes('aria-label')).toBe(
        '募集締め切り日をクリア',
      );
    });
  });
});
