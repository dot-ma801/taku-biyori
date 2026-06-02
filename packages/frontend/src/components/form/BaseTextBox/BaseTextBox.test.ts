// このファイルを編集するときは README の「単体テスト項目」も更新が必要か確認してください。
// → ./README.md

import { describe, it, expect } from 'vitest';
import { mount } from '@vue/test-utils';
import BaseTextBox from '@/components/form/BaseTextBox/BaseTextBox.vue';

// NOTE: @vuetify/v0 では type は Input.Control ではなく Input.Root に渡す必要がある。
//       Input.Control は useInputRoot() から root.type を取得して controlAttrs にセットし、
//       mergeProps(attrs, controlAttrs) で後勝ちするため Input.Control への :type は無視される。
//       BaseTextBox.vue では Input.Root に :type を渡すことで正しく動作する。

describe('BaseTextBox', () => {
  describe('レンダリング', () => {
    it('デフォルト props でレンダリングされる', () => {
      // Arrange & Act
      const wrapper = mount(BaseTextBox);

      // Assert
      expect(wrapper.find('.textbox').exists()).toBe(true);
    });
  });

  describe('label', () => {
    it('label prop を渡したときラベルテキストが表示される', () => {
      // Arrange & Act
      const wrapper = mount(BaseTextBox, {
        props: { label: 'メールアドレス' },
      });

      // Assert
      expect(wrapper.find('.textbox__label').text()).toBe('メールアドレス');
    });

    it('label prop がないとき .textbox__label が表示されない', () => {
      // Arrange & Act
      const wrapper = mount(BaseTextBox);

      // Assert
      expect(wrapper.find('.textbox__label').exists()).toBe(false);
    });
  });

  describe('placeholder', () => {
    it('placeholder prop を渡したとき input のプレースホルダーに反映される', () => {
      // Arrange & Act
      const wrapper = mount(BaseTextBox, {
        props: { placeholder: 'example@email.com' },
      });

      // Assert
      expect(wrapper.find('.textbox__control').attributes('placeholder')).toBe(
        'example@email.com',
      );
    });
  });

  describe('hint', () => {
    it('hint prop を渡したときヒントテキストが表示される', () => {
      // Arrange & Act
      const wrapper = mount(BaseTextBox, {
        props: { hint: 'ログインに使用します' },
      });

      // Assert
      expect(wrapper.find('.textbox__hint').text()).toBe(
        'ログインに使用します',
      );
    });
  });

  describe('modelValue', () => {
    it('modelValue の値が input に反映される', () => {
      // Arrange & Act
      const wrapper = mount(BaseTextBox, {
        props: { modelValue: 'test@example.com' },
      });

      // Assert
      expect(
        (wrapper.find('.textbox__control').element as HTMLInputElement).value,
      ).toBe('test@example.com');
    });

    it('入力すると update:modelValue イベントが発火する', async () => {
      // Arrange
      const wrapper = mount(BaseTextBox);

      // Act
      await wrapper.find('.textbox__control').setValue('新しい入力値');

      // Assert
      expect(wrapper.emitted('update:modelValue')).toBeTruthy();
    });
  });

  describe('type', () => {
    it.each(['text', 'email', 'password', 'number'] as const)(
      'type="%s" のとき input の type 属性が "%s" になる',
      (type) => {
        // Arrange & Act
        const wrapper = mount(BaseTextBox, { props: { type } });

        // Assert
        expect(wrapper.find('.textbox__control').attributes('type')).toBe(type);
      },
    );
  });

  describe('disabled / readonly', () => {
    it('disabled=true のとき input が入力不能になる', () => {
      // Arrange & Act
      const wrapper = mount(BaseTextBox, { props: { disabled: true } });

      // Assert
      expect(
        (wrapper.find('.textbox__control').element as HTMLInputElement)
          .disabled,
      ).toBe(true);
    });

    it('readonly=true のとき input が読み取り専用になる', () => {
      // Arrange & Act
      const wrapper = mount(BaseTextBox, { props: { readonly: true } });

      // Assert
      expect(
        (wrapper.find('.textbox__control').element as HTMLInputElement)
          .readOnly,
      ).toBe(true);
    });
  });
});
