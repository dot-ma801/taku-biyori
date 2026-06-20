import { describe, expect, it } from 'vitest';
import { getGameSessionStatus } from '@/game-session/domain/game-session-status';

const base = {
  isPublished: false,
  openUntil: null,
  scheduledAt: null,
  completedAt: null,
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

  it('scheduled_at が確定済みで当日前なら confirmed', () => {
    // Arrange
    const input = {
      ...base,
      isPublished: true,
      scheduledAt: daysFromNow(7),
    };

    // Act / Assert
    expect(getGameSessionStatus(input)).toBe('confirmed');
  });

  it('scheduled_at が今日なら today', () => {
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

  it('now を注入して比較できる', () => {
    // Arrange
    const fixedNow = new Date('2025-08-10T12:00:00Z');
    const future = new Date('2025-08-15T00:00:00Z');
    const input = { ...base, isPublished: true, openUntil: future };

    // Act / Assert
    expect(getGameSessionStatus(input, fixedNow)).toBe('open');
  });
});
