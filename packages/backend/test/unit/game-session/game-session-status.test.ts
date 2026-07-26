import { describe, expect, it } from 'vitest';
import { getGameSessionStatus } from '@/game-session/domain/game-session-status';

// 卓は日程が確定した状態でのみ存在するため scheduledAt は必ず入る（design-v1.1 §8）
const base = {
  isPublished: false,
  scheduledAt: new Date(2025, 0, 1),
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

  // 段階6b/6c: 募集・日程調整は募集枠へ移したため、卓は open / scheduling に落ちない
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

  // isToday はローカル日時（getFullYear/getMonth/getDate）で比較するため、
  // フィクスチャも UTC 文字列ではなくローカル時刻で組み立てて
  // 実行環境のタイムゾーンに依存しないようにする。
  it('now を注入して比較できる', () => {
    // Arrange
    const fixedNow = new Date(2025, 7, 10, 12, 0, 0);
    const input = {
      ...base,
      isPublished: true,
      scheduledAt: new Date(2025, 7, 10, 0, 0, 0),
    };

    // Act / Assert
    expect(getGameSessionStatus(input, fixedNow)).toBe('today');
  });

  it('now を注入したとき別日の scheduled_at は confirmed になる', () => {
    // Arrange
    const fixedNow = new Date(2025, 7, 10, 12, 0, 0);
    const input = {
      ...base,
      isPublished: true,
      scheduledAt: new Date(2025, 7, 11, 0, 0, 0),
    };

    // Act / Assert
    expect(getGameSessionStatus(input, fixedNow)).toBe('confirmed');
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
