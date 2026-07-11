import { describe, expect, it } from 'vitest';
import { getGameSessionStatus } from '@/game-session/domain/game-session-status';

const base = {
  isPublished: false,
  openUntil: null,
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

  it('is_published=true かつ open_until が未来なら open', () => {
    // Arrange
    const input = { ...base, isPublished: true, openUntil: daysFromNow(1) };

    // Act / Assert
    expect(getGameSessionStatus(input)).toBe('open');
  });

  it('is_published=true かつ open_until が過去なら scheduling', () => {
    // Arrange
    const input = { ...base, isPublished: true, openUntil: daysFromNow(-1) };

    // Act / Assert
    expect(getGameSessionStatus(input)).toBe('scheduling');
  });

  it('is_published=true かつ open_until=null なら open（締め切りなし）', () => {
    // Arrange
    const input = { ...base, isPublished: true, openUntil: null };

    // Act / Assert
    expect(getGameSessionStatus(input)).toBe('open');
  });

  it('open_until が過去かつ scheduled_at が確定済みで当日前なら confirmed', () => {
    // Arrange
    const input = {
      ...base,
      isPublished: true,
      openUntil: daysFromNow(-7),
      scheduledAt: daysFromNow(7),
    };

    // Act / Assert
    expect(getGameSessionStatus(input)).toBe('confirmed');
  });

  it('open_until が過去かつ scheduled_at が今日なら today', () => {
    // Arrange
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const input = {
      ...base,
      isPublished: true,
      openUntil: daysFromNow(-1),
      scheduledAt: today,
    };

    // Act / Assert
    expect(getGameSessionStatus(input)).toBe('today');
  });

  it('open_until が過去かつ completed_at がセット済みなら completed', () => {
    // Arrange
    const input = {
      ...base,
      isPublished: true,
      openUntil: daysFromNow(-7),
      scheduledAt: daysFromNow(-1),
      completedAt: new Date(),
    };

    // Act / Assert
    expect(getGameSessionStatus(input)).toBe('completed');
  });

  it('open_until が未来かつ scheduled_at が設定済みでも open（募集期間を優先）', () => {
    // Arrange
    const input = {
      ...base,
      isPublished: true,
      openUntil: daysFromNow(3),
      scheduledAt: daysFromNow(7),
    };

    // Act / Assert
    expect(getGameSessionStatus(input)).toBe('open');
  });

  it('now を注入して比較できる', () => {
    // Arrange
    const fixedNow = new Date('2025-08-10T12:00:00Z');
    const future = new Date('2025-08-15T00:00:00Z');
    const input = { ...base, isPublished: true, openUntil: future };

    // Act / Assert
    expect(getGameSessionStatus(input, fixedNow)).toBe('open');
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
      openUntil: daysFromNow(-7),
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
      openUntil: daysFromNow(-7),
      scheduledAt: daysFromNow(-1),
      completedAt: new Date(),
      cancelledAt: new Date('2025-01-01'),
    };

    // Act / Assert
    expect(getGameSessionStatus(input)).toBe('cancelled');
  });
});
