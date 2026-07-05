import { describe, it, expect } from 'vitest';
import { mount } from '@vue/test-utils';
import InputBasicInfo from '@/features/GameSession/Edit/InputBasicInfo.vue';
import BaseTextBox from '@/components/form/BaseTextBox/BaseTextBox.vue';

describe('InputBasicInfo', () => {
  describe('募集人数のバリデーションルール', () => {
    function getMaxMembersRules(wrapper: ReturnType<typeof mount>) {
      const maxMembersBox = wrapper
        .findAllComponents(BaseTextBox)
        .find((box) => box.props('label') === '募集人数（自分を含めて）');
      return maxMembersBox?.props('rules') as
        | ((value: unknown) => true | string)[]
        | undefined;
    }

    it('範囲外（1）を渡すとエラーメッセージを返す', () => {
      // Arrange
      const wrapper = mount(InputBasicInfo);
      const rules = getMaxMembersRules(wrapper);

      // Act
      const result = rules?.[0]?.('1');

      // Assert
      expect(result).toBe('募集人数は2〜20人の範囲で入力してください');
    });

    it('範囲外（21）を渡すとエラーメッセージを返す', () => {
      // Arrange
      const wrapper = mount(InputBasicInfo);
      const rules = getMaxMembersRules(wrapper);

      // Act
      const result = rules?.[0]?.('21');

      // Assert
      expect(result).toBe('募集人数は2〜20人の範囲で入力してください');
    });

    it('範囲内（2）を渡すと true を返す', () => {
      // Arrange
      const wrapper = mount(InputBasicInfo);
      const rules = getMaxMembersRules(wrapper);

      // Act
      const result = rules?.[0]?.('2');

      // Assert
      expect(result).toBe(true);
    });

    it('空文字を渡すと true を返す（未入力はエラーにしない）', () => {
      // Arrange
      const wrapper = mount(InputBasicInfo);
      const rules = getMaxMembersRules(wrapper);

      // Act
      const result = rules?.[0]?.('');

      // Assert
      expect(result).toBe(true);
    });
  });
});
