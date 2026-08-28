import { describe, expect, it } from 'vitest';
import { getLobbyStatus } from '@/lobby/domain/lobby-status';

const base = {
  isPublished: false,
  openUntil: null,
  cancelledAt: null,
};

const daysFromNow = (n: number): Date => {
  const d = new Date();
  d.setDate(d.getDate() + n);
  return d;
};

describe('getLobbyStatus', () => {
  it('cancelled_at がセット済みなら cancelled（最優先）', () => {
    // Arrange
    const input = {
      ...base,
      isPublished: true,
      cancelledAt: new Date(),
    };

    // Act / Assert
    expect(getLobbyStatus(input)).toBe('cancelled');
  });

  it('is_published=false なら draft', () => {
    // Arrange / Act / Assert
    expect(getLobbyStatus({ ...base, isPublished: false })).toBe('draft');
  });

  it('is_published=true かつ open_until が未来なら open', () => {
    // Arrange
    const input = { ...base, isPublished: true, openUntil: daysFromNow(1) };

    // Act / Assert
    expect(getLobbyStatus(input)).toBe('open');
  });

  it('is_published=true かつ open_until=null なら open（締め切りなし）', () => {
    // Arrange
    const input = { ...base, isPublished: true, openUntil: null };

    // Act / Assert
    expect(getLobbyStatus(input)).toBe('open');
  });

  it('is_published=true かつ open_until が過去なら scheduling', () => {
    // Arrange
    const input = { ...base, isPublished: true, openUntil: daysFromNow(-1) };

    // Act / Assert
    expect(getLobbyStatus(input)).toBe('scheduling');
  });

  it('now を注入して比較できる', () => {
    // Arrange
    const fixedNow = new Date('2025-08-10T12:00:00Z');
    const future = new Date('2025-08-15T00:00:00Z');
    const input = { ...base, isPublished: true, openUntil: future };

    // Act / Assert
    expect(getLobbyStatus(input, fixedNow)).toBe('open');
  });
});
