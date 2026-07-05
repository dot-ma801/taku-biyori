import { describe, it, expect } from 'vitest';
import { mount } from '@vue/test-utils';
import InputScheduleInfo from '@/features/GameSession/Edit/InputScheduleInfo.vue';

describe('InputScheduleInfo', () => {
  describe('候補日への入力による開催日の破棄', () => {
    it('候補日に値が入ると開催日が破棄される', async () => {
      // Arrange
      const wrapper = mount(InputScheduleInfo, {
        props: { scheduledAt: '2025-06-15', pendingDates: [] },
      });

      // Act
      await wrapper.setProps({ pendingDates: ['2025-06-10'] });

      // Assert
      const emitted = wrapper.emitted('update:scheduledAt');
      expect(emitted?.[emitted.length - 1]).toEqual(['']);
    });

    it('スイッチを ON にしただけでは開催日は破棄されない', async () => {
      // Arrange
      const wrapper = mount(InputScheduleInfo, {
        props: { scheduledAt: '2025-06-15' },
      });

      // Act
      await wrapper.find('.switch__root').trigger('click');

      // Assert
      expect(wrapper.emitted('update:scheduledAt')).toBeFalsy();
    });

    it('isScheduled=true のときスイッチが表示されず開催日は破棄されない', () => {
      // Arrange & Act
      const wrapper = mount(InputScheduleInfo, {
        props: { scheduledAt: '2025-06-15', isScheduled: true },
      });

      // Assert
      expect(wrapper.find('.switch__root').exists()).toBe(false);
      expect(wrapper.emitted('update:scheduledAt')).toBeFalsy();
    });
  });
});
