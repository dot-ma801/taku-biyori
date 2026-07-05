import { describe, it, expect, vi, beforeEach } from 'vitest';
import { mount, flushPromises } from '@vue/test-utils';
import InputScheduleInfo from '@/features/GameSession/Edit/InputScheduleInfo.vue';

vi.mock('@/api/game-session', () => ({
  listAvailabilityDates: vi.fn(),
  bulkUpdateAvailabilityDates: vi.fn(),
}));

import { listAvailabilityDates } from '@/api/game-session';

describe('InputScheduleInfo', () => {
  describe('候補日ピッカーの初期表示', () => {
    beforeEach(() => {
      vi.clearAllMocks();
    });

    it('既に候補日が登録されている卓を開くと候補日ピッカーが自動表示される', async () => {
      // Arrange
      vi.mocked(listAvailabilityDates).mockResolvedValue([
        { id: 'date-1', date: '2025-07-01', answers: [] },
      ]);

      // Act
      const wrapper = mount(InputScheduleInfo, {
        props: { gameSessionId: 'session-1' },
      });
      await flushPromises();

      // Assert
      expect(wrapper.find('.switch__root').attributes('aria-checked')).toBe(
        'true',
      );
    });

    it('候補日が0件の卓を開いても候補日ピッカーは自動表示されない', async () => {
      // Arrange
      vi.mocked(listAvailabilityDates).mockResolvedValue([]);

      // Act
      const wrapper = mount(InputScheduleInfo, {
        props: { gameSessionId: 'session-1' },
      });
      await flushPromises();

      // Assert
      expect(wrapper.find('.switch__root').attributes('aria-checked')).toBe(
        'false',
      );
    });

    it('新規作成フロー（gameSessionId 未指定）では自動表示ロジックが働かない', async () => {
      // Arrange & Act
      const wrapper = mount(InputScheduleInfo);
      await flushPromises();

      // Assert
      expect(wrapper.find('.switch__root').attributes('aria-checked')).toBe(
        'false',
      );
      expect(listAvailabilityDates).not.toHaveBeenCalled();
    });
  });

  describe('候補日への入力による開催日の破棄', () => {
    it('候補日に値が入ると開催日が破棄される', async () => {
      // Arrange
      const wrapper = mount(InputScheduleInfo, {
        props: { scheduledAt: '2025-06-15', pendingDates: [] },
      });
      // 複数候補日モードに切り替える（ユーザー操作を模す）
      await wrapper.find('.switch__root').trigger('click');

      // Act: 候補日ピッカーでの選択（ユーザー操作）をシミュレートする
      const cell = wrapper
        .findAll('.datepicker__cell')
        .find(
          (c) =>
            !c.classes('datepicker__cell--empty') &&
            !c.classes('datepicker__cell--disabled'),
        );
      await cell?.trigger('click');

      // Assert
      const emitted = wrapper.emitted('update:scheduledAt');
      expect(emitted?.[emitted.length - 1]).toEqual(['']);
    });

    it('候補日の非同期取得（マウント時の初期反映）では開催日は破棄されない', async () => {
      // Arrange
      vi.mocked(listAvailabilityDates).mockResolvedValue([
        { id: 'date-1', date: '2025-07-01', answers: [] },
      ]);

      // Act
      const wrapper = mount(InputScheduleInfo, {
        props: { gameSessionId: 'session-1', scheduledAt: '2025-06-15' },
      });
      await flushPromises();

      // Assert
      expect(wrapper.emitted('update:scheduledAt')).toBeFalsy();
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
