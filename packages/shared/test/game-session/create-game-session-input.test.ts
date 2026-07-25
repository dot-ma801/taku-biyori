import { describe, expect, it, vi, afterEach } from 'vitest';
import { CreateGameSessionInputSchema } from '@/game-session';

afterEach(() => {
  vi.useRealTimers();
});

describe('CreateGameSessionInputSchema', () => {
  // 卓は日程が確定した状態でのみ存在する（design-v1.1 §8）
  it('title と scheduledAt があれば成功する', () => {
    // Arrange
    vi.setSystemTime(new Date('2025-06-15T00:00:00'));
    const input = { title: '卓', scheduledAt: '2025-06-20' };

    // Act
    const result = CreateGameSessionInputSchema.safeParse(input);

    // Assert
    expect(result.success).toBe(true);
  });

  it('scheduledAt がなければ失敗する（直接卓立ては日程必須）', () => {
    // Arrange
    const input = { title: '卓' };

    // Act
    const result = CreateGameSessionInputSchema.safeParse(input);

    // Assert
    expect(result.success).toBe(false);
  });

  // 募集締め切り（openUntil）は募集枠（lobby）の関心事であり卓は受け付けない
  it('openUntil は受け付けず、結果に含まれない', () => {
    // Arrange
    vi.setSystemTime(new Date('2025-06-15T00:00:00'));
    const input = {
      title: '卓',
      scheduledAt: '2025-06-20',
      openUntil: '2025-06-16',
    };

    // Act
    const result = CreateGameSessionInputSchema.safeParse(input);

    // Assert
    expect(result.success).toBe(true);
    expect(result.data).not.toHaveProperty('openUntil');
  });

  describe('過去日の禁止', () => {
    it('scheduledAt が過去日なら失敗する', () => {
      // Arrange
      vi.setSystemTime(new Date('2025-06-15T00:00:00'));
      const input = { title: '卓', scheduledAt: '2025-06-14' };

      // Act
      const result = CreateGameSessionInputSchema.safeParse(input);

      // Assert
      expect(result.success).toBe(false);
    });

    it('scheduledAt が今日なら成功する', () => {
      // Arrange
      vi.setSystemTime(new Date('2025-06-15T00:00:00'));
      const input = { title: '卓', scheduledAt: '2025-06-15' };

      // Act
      const result = CreateGameSessionInputSchema.safeParse(input);

      // Assert
      expect(result.success).toBe(true);
    });
  });
});
