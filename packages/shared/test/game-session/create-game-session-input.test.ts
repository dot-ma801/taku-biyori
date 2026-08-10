import { describe, expect, it, vi, afterEach } from 'vitest';
import {
  CreateGameSessionInputSchema,
  UpdateGameSessionInputSchema,
} from '@/game-session';
import { TIME_NOTE_MAX_LENGTH } from '@/time-note';

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

describe('卓の timeNote（時刻メモ）', () => {
  it('timeNote を指定できる（募集枠から引き継いだ時刻メモの受け皿）', () => {
    // Arrange
    vi.setSystemTime(new Date('2025-06-15T00:00:00'));
    const input = {
      title: '卓',
      scheduledAt: '2025-06-20',
      timeNote: '19:00〜',
    };

    // Act
    const result = CreateGameSessionInputSchema.safeParse(input);

    // Assert
    expect(result.success).toBe(true);
    expect(result.data?.timeNote).toBe('19:00〜');
  });

  it('空文字の timeNote は null に正規化される', () => {
    // Arrange
    vi.setSystemTime(new Date('2025-06-15T00:00:00'));
    const input = { title: '卓', scheduledAt: '2025-06-20', timeNote: '  ' };

    // Act
    const result = CreateGameSessionInputSchema.safeParse(input);

    // Assert
    expect(result.success).toBe(true);
    expect(result.data?.timeNote).toBeNull();
  });

  it(`timeNote が ${TIME_NOTE_MAX_LENGTH + 1} 文字なら失敗する`, () => {
    // Arrange
    vi.setSystemTime(new Date('2025-06-15T00:00:00'));
    const input = {
      title: '卓',
      scheduledAt: '2025-06-20',
      timeNote: 'あ'.repeat(TIME_NOTE_MAX_LENGTH + 1),
    };

    // Act
    const result = CreateGameSessionInputSchema.safeParse(input);

    // Assert
    expect(result.success).toBe(false);
  });

  it('更新でも timeNote に null を指定してクリアできる', () => {
    // Arrange
    const input = { timeNote: null };

    // Act
    const result = UpdateGameSessionInputSchema.safeParse(input);

    // Assert
    expect(result.success).toBe(true);
    expect(result.data?.timeNote).toBeNull();
  });
});
