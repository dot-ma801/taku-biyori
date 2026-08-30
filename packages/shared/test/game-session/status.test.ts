import { describe, expect, it } from 'vitest';
import { GameSessionStatus, getGameSessionStatus } from '@/game-session/status';

// design-v2 §4-2 の導出表をそのまま写したもの。**先頭一致**で判定する。
//
// | # | 条件 | ステータス |
// |---|---|---|
// | 1 | `cancelledAt != null` | `cancelled` |
// | 2 | `completedAt != null` | `completed` |
// | 3 | `scheduledAt` が今日と同じ日付 | `today` |
// | 4 | それ以外 | `scheduled` |

const TODAY = '2026-08-30';
const YESTERDAY = '2026-08-29';
const TOMORROW = '2026-08-31';

describe('getGameSessionStatus', () => {
  it('中止されていれば cancelled を返す', () => {
    // Arrange
    const facts = {
      scheduledAt: TOMORROW,
      completedAt: null,
      cancelledAt: '2026-08-20T10:00:00.000Z',
    };

    // Act
    const result = getGameSessionStatus(facts, TODAY);

    // Assert
    expect(result).toBe(GameSessionStatus.cancelled);
  });

  it('完了と中止が両方あれば cancelled を優先する（先頭一致）', () => {
    // Arrange
    const facts = {
      scheduledAt: YESTERDAY,
      completedAt: '2026-08-29T22:00:00.000Z',
      cancelledAt: '2026-08-29T23:00:00.000Z',
    };

    // Act
    const result = getGameSessionStatus(facts, TODAY);

    // Assert
    expect(result).toBe(GameSessionStatus.cancelled);
  });

  it('完了していれば completed を返す', () => {
    // Arrange
    const facts = {
      scheduledAt: YESTERDAY,
      completedAt: '2026-08-29T22:00:00.000Z',
      cancelledAt: null,
    };

    // Act
    const result = getGameSessionStatus(facts, TODAY);

    // Assert
    expect(result).toBe(GameSessionStatus.completed);
  });

  it('開催日が今日なら completed より後に評価され today を返す', () => {
    // Arrange
    const facts = {
      scheduledAt: TODAY,
      completedAt: null,
      cancelledAt: null,
    };

    // Act
    const result = getGameSessionStatus(facts, TODAY);

    // Assert
    expect(result).toBe(GameSessionStatus.today);
  });

  it('開催日が今日でも完了済みなら completed を返す', () => {
    // Arrange
    const facts = {
      scheduledAt: TODAY,
      completedAt: '2026-08-30T22:00:00.000Z',
      cancelledAt: null,
    };

    // Act
    const result = getGameSessionStatus(facts, TODAY);

    // Assert
    expect(result).toBe(GameSessionStatus.completed);
  });

  it('開催日が未来なら scheduled を返す', () => {
    // Arrange
    const facts = {
      scheduledAt: TOMORROW,
      completedAt: null,
      cancelledAt: null,
    };

    // Act
    const result = getGameSessionStatus(facts, TODAY);

    // Assert
    expect(result).toBe(GameSessionStatus.scheduled);
  });

  it('開催日を過ぎていても未完了なら scheduled のままにする', () => {
    // Arrange
    const facts = {
      scheduledAt: YESTERDAY,
      completedAt: null,
      cancelledAt: null,
    };

    // Act
    const result = getGameSessionStatus(facts, TODAY);

    // Assert
    expect(result).toBe(GameSessionStatus.scheduled);
  });

  it('Date 型のファクト（backend の DB 行）でも判定できる', () => {
    // Arrange
    const facts = {
      scheduledAt: YESTERDAY,
      completedAt: new Date('2026-08-29T22:00:00.000Z'),
      cancelledAt: null,
    };

    // Act
    const result = getGameSessionStatus(facts, TODAY);

    // Assert
    expect(result).toBe(GameSessionStatus.completed);
  });

  it('today を省略すると実行環境のローカル日付で判定する', () => {
    // Arrange
    const now = new Date();
    const localToday = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`;

    // Act
    const result = getGameSessionStatus({
      scheduledAt: localToday,
      completedAt: null,
      cancelledAt: null,
    });

    // Assert
    expect(result).toBe(GameSessionStatus.today);
  });

  it('導出されるのは design-v2 §4-2 の4値だけで、旧値は返さない', () => {
    // Arrange
    const derived = new Set(
      [
        { scheduledAt: TOMORROW, completedAt: null, cancelledAt: null },
        { scheduledAt: TODAY, completedAt: null, cancelledAt: null },
        {
          scheduledAt: TODAY,
          completedAt: '2026-08-30T22:00:00.000Z',
          cancelledAt: null,
        },
        {
          scheduledAt: TODAY,
          completedAt: null,
          cancelledAt: '2026-08-30T22:00:00.000Z',
        },
      ].map((facts) => getGameSessionStatus(facts, TODAY)),
    );

    // Act
    const result = [...derived].sort();

    // Assert
    expect(result).toEqual([
      GameSessionStatus.cancelled,
      GameSessionStatus.completed,
      GameSessionStatus.scheduled,
      GameSessionStatus.today,
    ]);
  });
});
