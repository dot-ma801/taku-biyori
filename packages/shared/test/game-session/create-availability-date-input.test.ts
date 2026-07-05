import { describe, expect, it, vi, afterEach } from 'vitest';
import { CreateAvailabilityDateInputSchema } from '@/game-session';

afterEach(() => {
  vi.useRealTimers();
});

describe('CreateAvailabilityDateInputSchema', () => {
  it('今日以降の日付なら成功する', () => {
    // Arrange
    vi.setSystemTime(new Date('2025-06-15T00:00:00'));
    const input = { date: '2025-06-15' };

    // Act
    const result = CreateAvailabilityDateInputSchema.safeParse(input);

    // Assert
    expect(result.success).toBe(true);
  });

  it('過去日なら失敗する', () => {
    // Arrange
    vi.setSystemTime(new Date('2025-06-15T00:00:00'));
    const input = { date: '2025-06-14' };

    // Act
    const result = CreateAvailabilityDateInputSchema.safeParse(input);

    // Assert
    expect(result.success).toBe(false);
  });
});
