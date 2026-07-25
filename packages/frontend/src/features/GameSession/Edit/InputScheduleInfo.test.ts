import { describe, it, expect } from 'vitest';
import { mount } from '@vue/test-utils';
import InputScheduleInfo from '@/features/GameSession/Edit/InputScheduleInfo.vue';

describe('InputScheduleInfo', () => {
  describe('直接卓立て（日程必須）', () => {
    it('開催日が必須項目として表示される', () => {
      // Arrange & Act
      const wrapper = mount(InputScheduleInfo);

      // Assert
      expect(wrapper.find('.datepicker__required').exists()).toBe(true);
    });

    it('候補日（複数日選択）のスイッチを表示しない', () => {
      // Arrange & Act
      const wrapper = mount(InputScheduleInfo);

      // Assert
      expect(wrapper.find('.switch__root').exists()).toBe(false);
    });

    it('開催日を選ぶと update:scheduledAt が発火する', async () => {
      // Arrange
      const wrapper = mount(InputScheduleInfo, {
        props: { scheduledAt: '' },
      });

      // Act
      const cell = wrapper
        .findAll('.datepicker__cell')
        .find(
          (c) =>
            !c.classes('datepicker__cell--empty') &&
            !c.classes('datepicker__cell--disabled'),
        );
      await cell?.trigger('click');

      // Assert
      expect(wrapper.emitted('update:scheduledAt')).toBeTruthy();
    });
  });
});
