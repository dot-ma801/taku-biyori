import { describe, expect, it, vi, afterEach } from 'vitest';
import { CreateGameSessionInputSchema } from '@/game-session';

afterEach(() => {
  vi.useRealTimers();
});

describe('CreateGameSessionInputSchema', () => {
  it('title のみでも成功する', () => {
    // Arrange
    const input = { title: '卓' };

    // Act
    const result = CreateGameSessionInputSchema.safeParse(input);

    // Assert
    expect(result.success).toBe(true);
  });

  describe('過去日の禁止', () => {
    it('openUntil が過去日なら失敗する', () => {
      // Arrange
      vi.setSystemTime(new Date('2025-06-15T00:00:00'));
      const input = { title: '卓', openUntil: '2025-06-14' };

      // Act
      const result = CreateGameSessionInputSchema.safeParse(input);

      // Assert
      expect(result.success).toBe(false);
    });

    it('scheduledAt が過去日なら失敗する', () => {
      // Arrange
      vi.setSystemTime(new Date('2025-06-15T00:00:00'));
      const input = { title: '卓', scheduledAt: '2025-06-14' };

      // Act
      const result = CreateGameSessionInputSchema.safeParse(input);

      // Assert
      expect(result.success).toBe(false);
    });

    it('openUntil・scheduledAt が今日以降なら成功する', () => {
      // Arrange
      vi.setSystemTime(new Date('2025-06-15T00:00:00'));
      const input = {
        title: '卓',
        openUntil: '2025-06-15',
        scheduledAt: '2025-06-20',
      };

      // Act
      const result = CreateGameSessionInputSchema.safeParse(input);

      // Assert
      expect(result.success).toBe(true);
    });
  });
});
