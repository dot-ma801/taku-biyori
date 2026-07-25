import { describe, expect, it } from 'vitest';
import { getGameSessionStatus } from '@/game-session/domain/game-session-status';

const base = {
  isPublished: false,
  scheduledAt: null,
  completedAt: null,
  cancelledAt: null,
};

const daysFromNow = (n: number): Date => {
  const d = new Date();
  d.setDate(d.getDate() + n);
  return d;
};

describe('getGameSessionStatus', () => {
  it('is_published=false なら draft', () => {
    // Arrange / Act / Assert
    expect(getGameSessionStatus({ ...base, isPublished: false })).toBe('draft');
  });

  // 段階6b: 募集（open_until）は募集枠へ移したため、公開済みの卓は open に落ちない
  it('is_published=true かつ scheduled_at が当日前なら confirmed', () => {
    // Arrange
    const input = {
      ...base,
      isPublished: true,
      scheduledAt: daysFromNow(7),
    };

    // Act / Assert
    expect(getGameSessionStatus(input)).toBe('confirmed');
  });

  it('is_published=true かつ scheduled_at が今日なら today', () => {
    // Arrange
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const input = { ...base, isPublished: true, scheduledAt: today };

    // Act / Assert
    expect(getGameSessionStatus(input)).toBe('today');
  });

  it('completed_at がセット済みなら completed', () => {
    // Arrange
    const input = {
      ...base,
      isPublished: true,
      scheduledAt: daysFromNow(-1),
      completedAt: new Date(),
    };

    // Act / Assert
    expect(getGameSessionStatus(input)).toBe('completed');
  });

  // scheduled_at の NOT NULL 化は段階6c 担当のため、それまでのフォールバックとして残す
  it('is_published=true かつ scheduled_at=null なら scheduling', () => {
    // Arrange
    const input = { ...base, isPublished: true, scheduledAt: null };

    // Act / Assert
    expect(getGameSessionStatus(input)).toBe('scheduling');
  });

  it('now を注入して比較できる', () => {
    // Arrange
    const fixedNow = new Date('2025-08-10T12:00:00Z');
    const input = {
      ...base,
      isPublished: true,
      scheduledAt: new Date('2025-08-10T00:00:00Z'),
    };

    // Act / Assert
    expect(getGameSessionStatus(input, fixedNow)).toBe('today');
  });

  it('cancelled_at がセットされていれば cancelled（最優先・非公開でも）', () => {
    // Arrange
    const input = {
      ...base,
      isPublished: false,
      cancelledAt: new Date('2025-01-01'),
    };

    // Act / Assert
    expect(getGameSessionStatus(input)).toBe('cancelled');
  });

  it('cancelled_at がセットされていれば confirmed 相当の状態でも cancelled が優先される', () => {
    // Arrange
    const input = {
      ...base,
      isPublished: true,
      scheduledAt: daysFromNow(7),
      cancelledAt: new Date('2025-01-01'),
    };

    // Act / Assert
    expect(getGameSessionStatus(input)).toBe('cancelled');
  });

  it('cancelled_at がセットされていれば completed 相当の状態でも cancelled が優先される', () => {
    // Arrange
    const input = {
      ...base,
      isPublished: true,
      scheduledAt: daysFromNow(-1),
      completedAt: new Date(),
      cancelledAt: new Date('2025-01-01'),
    };

    // Act / Assert
    expect(getGameSessionStatus(input)).toBe('cancelled');
  });
});
