// このファイルを編集するときは README の「単体テスト項目」も更新が必要か確認してください。
// → ./README.md

import { describe, it, expect } from 'vitest';
import { mount } from '@vue/test-utils';
import AvailabilityResponse from '@/components/common/AvailabilityResponse/AvailabilityResponse.vue';

describe('AvailabilityResponse', () => {
  describe('レンダリング', () => {
    it('○△× の 3 ボタンが表示される', () => {
      // Arrange & Act
      const wrapper = mount(AvailabilityResponse);

      // Assert
      const buttons = wrapper.findAll('button');
      expect(buttons.length).toBe(3);
      expect(wrapper.text()).toContain('○');
      expect(wrapper.text()).toContain('△');
      expect(wrapper.text()).toContain('×');
    });
  });

  describe('modelValue', () => {
    it('modelValue="maru" のとき maru ボタンに active クラスが付与される', () => {
      // Arrange & Act
      const wrapper = mount(AvailabilityResponse, {
        props: { modelValue: 'maru' },
      });

      // Assert
      expect(wrapper.find('.availability__btn--maru').classes()).toContain(
        'availability__btn--active',
      );
    });

    it('ボタンをクリックすると update:modelValue が発火する', async () => {
      // Arrange
      const wrapper = mount(AvailabilityResponse, {
        props: { modelValue: null },
      });

      // Act
      await wrapper.find('.availability__btn--maru').trigger('click');

      // Assert
      expect(wrapper.emitted('update:modelValue')).toEqual([['maru']]);
    });

    it('既に選択中のボタンをクリックすると null が emit される（トグル）', async () => {
      // Arrange
      const wrapper = mount(AvailabilityResponse, {
        props: { modelValue: 'sankaku' },
      });

      // Act
      await wrapper.find('.availability__btn--sankaku').trigger('click');

      // Assert
      expect(wrapper.emitted('update:modelValue')).toEqual([[null]]);
    });
  });

  describe('disabled', () => {
    it('disabled=true のときクリックしても emit しない', async () => {
      // Arrange
      const wrapper = mount(AvailabilityResponse, {
        props: { disabled: true },
      });

      // Act
      await wrapper.find('.availability__btn--maru').trigger('click');

      // Assert
      expect(wrapper.emitted('update:modelValue')).toBeUndefined();
    });
  });

  describe('アクセシビリティ', () => {
    it('role="radiogroup" と role="radio" が付与される', () => {
      // Arrange & Act
      const wrapper = mount(AvailabilityResponse);

      // Assert
      expect(wrapper.attributes('role')).toBe('radiogroup');
      expect(wrapper.findAll('[role="radio"]').length).toBe(3);
    });
  });
});
