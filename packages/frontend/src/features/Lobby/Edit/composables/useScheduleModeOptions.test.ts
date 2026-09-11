import { describe, it, expect } from 'vitest';
import { ref } from 'vue';
import { useScheduleModeOptions } from '@/features/Lobby/Edit/composables/useScheduleModeOptions';
import type { ScheduleMode } from '@/features/Lobby/Edit/composables/schedule-mode';

describe('useScheduleModeOptions', () => {
  it('選択肢をラベル・説明つきで返す', () => {
    // Arrange & Act
    const { options } = useScheduleModeOptions(() => 'poll');

    // Assert
    expect(options.value.map((o) => o.value)).toEqual(['poll', 'fixed']);
    expect(options.value[0]?.label).toBe('候補日を出して決める');
    expect(options.value[0]?.description).not.toBe('');
  });

  it('選ばれているものだけ isSelected が true になる', () => {
    // Arrange & Act
    const { options } = useScheduleModeOptions(() => 'fixed');

    // Assert
    expect(options.value.map((o) => o.isSelected)).toEqual([false, true]);
  });

  it('選択が変わると isSelected が追従する', () => {
    // Arrange
    const selected = ref<ScheduleMode>('poll');
    const { options } = useScheduleModeOptions(selected);

    // Act
    selected.value = 'fixed';

    // Assert
    expect(options.value.map((o) => o.isSelected)).toEqual([false, true]);
  });
});
