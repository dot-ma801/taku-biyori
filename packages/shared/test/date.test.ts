import { afterEach, describe, expect, it, vi } from 'vitest';
import { todayDateString } from '@/date';

describe('todayDateString', () => {
  afterEach(() => {
    vi.useRealTimers();
  });

  it('今日の日付を YYYY-MM-DD 形式で返す', () => {
    // Arrange
    vi.setSystemTime(new Date('2025-09-05T12:00:00'));

    // Act
    const result = todayDateString();

    // Assert
    expect(result).toBe('2025-09-05');
  });

  it('月・日が1桁のときゼロ埋めする', () => {
    // Arrange
    vi.setSystemTime(new Date('2025-01-02T00:00:00'));

    // Act
    const result = todayDateString();

    // Assert
    expect(result).toBe('2025-01-02');
  });
});
