import { describe, expect, it, vi } from 'vitest';
import { updateGameSessionStatus } from '@/game-session/application/update-game-session-status';
import type { UpdateGameSessionStatusRepository } from '@/game-session/application/update-game-session-status';
import type { GameSession } from '@taku-biyori/shared';
import { GameSessionStatus } from '@taku-biyori/shared';

// getGameSessionStatus の isToday はローカル日時（getFullYear/getMonth/getDate）で
// 比較するため、today 判定に関わる now・scheduled_at のフィクスチャは UTC 文字列では
// なくローカル時刻で組み立て、実行環境のタイムゾーンに依存しないようにする。
const baseSession: GameSession = {
  id: 'session-1',
  title: 'テスト卓',
  description: null,
  scenarioName: null,
  status: GameSessionStatus.draft,
  isPublished: false,
  scheduledAt: '2025-05-30',
  completedAt: null,
  cancelledAt: null,
  maxMembers: null,
  createdBy: 'user-1',
  createdAt: '2025-01-01T00:00:00.000Z',
  updatedAt: '2025-01-01T00:00:00.000Z',
};

const makeRepo = (
  overrides: Partial<UpdateGameSessionStatusRepository> = {},
): UpdateGameSessionStatusRepository => ({
  findHostUserId: vi.fn().mockResolvedValue('user-1'),
  findStatusFields: vi.fn().mockResolvedValue({
    isPublished: false,
    scheduledAt: new Date('2025-05-30'),
    completedAt: null,
    cancelledAt: null,
  }),
  publish: vi
    .fn()
    .mockResolvedValue({ ...baseSession, status: 'open', isPublished: true }),
  complete: vi.fn().mockResolvedValue({
    ...baseSession,
    status: 'completed',
    completedAt: '2025-01-01T00:00:00.000Z',
  }),
  cancel: vi.fn().mockResolvedValue({
    ...baseSession,
    status: 'cancelled',
    cancelledAt: '2025-01-01T00:00:00.000Z',
  }),
  ...overrides,
});

describe('updateGameSessionStatus', () => {
  describe('draft → open（公開）', () => {
    it('ホストが draft → open に遷移できる', async () => {
      // Arrange
      const repo = makeRepo();

      // Act
      const result = await updateGameSessionStatus(
        repo,
        'session-1',
        'user-1',
        { status: 'open' },
      );

      // Assert
      expect(result).toEqual({
        type: 'ok',
        gameSession: expect.objectContaining({ status: 'open' }),
      });
    });

    it('publish を呼び出す', async () => {
      // Arrange
      const repo = makeRepo();

      // Act
      await updateGameSessionStatus(repo, 'session-1', 'user-1', {
        status: 'open',
      });

      // Assert
      expect(repo.publish).toHaveBeenCalledWith('session-1');
    });

    it('draft 以外から open に遷移しようとすると invalidTransition を返す', async () => {
      // Arrange
      const repo = makeRepo({
        findStatusFields: vi.fn().mockResolvedValue({
          isPublished: true,
          scheduledAt: new Date('2025-05-30'),
          completedAt: null,
        }),
      });

      // Act
      const result = await updateGameSessionStatus(
        repo,
        'session-1',
        'user-1',
        { status: 'open' },
      );

      // Assert
      expect(result).toEqual({ type: 'invalidTransition' });
      expect(repo.publish).not.toHaveBeenCalled();
    });
  });

  describe('today → completed（完了）', () => {
    it('ホストが today → completed に遷移できる', async () => {
      // Arrange
      const now = new Date(2025, 5, 1, 10, 0, 0);
      const repo = makeRepo({
        findStatusFields: vi.fn().mockResolvedValue({
          isPublished: true,
          scheduledAt: new Date(2025, 5, 1, 0, 0, 0),
          completedAt: null,
        }),
      });

      // Act
      const result = await updateGameSessionStatus(
        repo,
        'session-1',
        'user-1',
        { status: 'completed' },
        now,
      );

      // Assert
      expect(result).toEqual({
        type: 'ok',
        gameSession: expect.objectContaining({ status: 'completed' }),
      });
    });

    it('complete を now で呼び出す', async () => {
      // Arrange
      const now = new Date(2025, 5, 1, 10, 0, 0);
      const repo = makeRepo({
        findStatusFields: vi.fn().mockResolvedValue({
          isPublished: true,
          scheduledAt: new Date(2025, 5, 1, 0, 0, 0),
          completedAt: null,
        }),
      });

      // Act
      await updateGameSessionStatus(
        repo,
        'session-1',
        'user-1',
        { status: 'completed' },
        now,
      );

      // Assert
      expect(repo.complete).toHaveBeenCalledWith('session-1', now);
    });

    it('complete が null を返す場合（cancel との並行実行に負けた場合）は invalidTransition を返す', async () => {
      // Arrange
      const now = new Date(2025, 5, 1, 10, 0, 0);
      const repo = makeRepo({
        findStatusFields: vi.fn().mockResolvedValue({
          isPublished: true,
          scheduledAt: new Date(2025, 5, 1, 0, 0, 0),
          completedAt: null,
          cancelledAt: null,
        }),
        complete: vi.fn().mockResolvedValue(null),
      });

      // Act
      const result = await updateGameSessionStatus(
        repo,
        'session-1',
        'user-1',
        { status: 'completed' },
        now,
      );

      // Assert
      expect(result).toEqual({ type: 'invalidTransition' });
    });

    it('today 以外から completed に遷移しようとすると invalidTransition を返す', async () => {
      // Arrange
      const now = new Date(2025, 5, 1, 10, 0, 0);
      const repo = makeRepo({
        findStatusFields: vi.fn().mockResolvedValue({
          isPublished: true,
          scheduledAt: new Date('2025-06-05'),
          completedAt: null,
        }),
      });

      // Act
      const result = await updateGameSessionStatus(
        repo,
        'session-1',
        'user-1',
        { status: 'completed' },
        now,
      );

      // Assert
      expect(result).toEqual({ type: 'invalidTransition' });
      expect(repo.complete).not.toHaveBeenCalled();
    });
  });

  describe('confirmed/today → cancelled（中止）', () => {
    it.each(['confirmed', 'today'] as const)(
      'ホストが %s → cancelled に遷移できる',
      async (currentStatus) => {
        // Arrange
        const now = new Date(2025, 5, 1, 10, 0, 0);
        const fields =
          currentStatus === 'today'
            ? {
                isPublished: true,
                scheduledAt: new Date(2025, 5, 1, 0, 0, 0),
                completedAt: null,
                cancelledAt: null,
              }
            : {
                isPublished: true,
                scheduledAt: new Date('2025-06-10'),
                completedAt: null,
                cancelledAt: null,
              };
        const repo = makeRepo({
          findStatusFields: vi.fn().mockResolvedValue(fields),
        });

        // Act
        const result = await updateGameSessionStatus(
          repo,
          'session-1',
          'user-1',
          { status: 'cancelled' },
          now,
        );

        // Assert
        expect(result).toEqual({
          type: 'ok',
          gameSession: expect.objectContaining({ status: 'cancelled' }),
        });
      },
    );

    it('cancel を now で呼び出す', async () => {
      // Arrange
      const now = new Date(2025, 5, 1, 10, 0, 0);
      const repo = makeRepo({
        findStatusFields: vi.fn().mockResolvedValue({
          isPublished: true,
          scheduledAt: new Date(2025, 5, 1, 0, 0, 0),
          completedAt: null,
          cancelledAt: null,
        }),
      });

      // Act
      await updateGameSessionStatus(
        repo,
        'session-1',
        'user-1',
        { status: 'cancelled' },
        now,
      );

      // Assert
      expect(repo.cancel).toHaveBeenCalledWith('session-1', now);
    });

    it.each(['draft', 'completed'] as const)(
      '%s から cancelled に遷移しようとすると invalidTransition を返す',
      async (currentStatus) => {
        // Arrange
        const now = new Date(2025, 5, 1, 10, 0, 0);
        const fieldsByStatus = {
          draft: {
            isPublished: false,
            scheduledAt: new Date('2025-05-30'),
            completedAt: null,
            cancelledAt: null,
          },
          completed: {
            isPublished: true,
            scheduledAt: new Date('2025-05-30'),
            completedAt: new Date('2025-05-31'),
            cancelledAt: null,
          },
        } as const;
        const repo = makeRepo({
          findStatusFields: vi
            .fn()
            .mockResolvedValue(fieldsByStatus[currentStatus]),
        });

        // Act
        const result = await updateGameSessionStatus(
          repo,
          'session-1',
          'user-1',
          { status: 'cancelled' },
          now,
        );

        // Assert
        expect(result).toEqual({ type: 'invalidTransition' });
        expect(repo.cancel).not.toHaveBeenCalled();
      },
    );

    it('既に cancelled の場合（二重中止）は invalidTransition を返す', async () => {
      // Arrange
      const now = new Date(2025, 5, 1, 10, 0, 0);
      const repo = makeRepo({
        findStatusFields: vi.fn().mockResolvedValue({
          isPublished: true,
          scheduledAt: new Date(2025, 5, 1, 0, 0, 0),
          completedAt: null,
          cancelledAt: new Date('2025-05-20'),
        }),
      });

      // Act
      const result = await updateGameSessionStatus(
        repo,
        'session-1',
        'user-1',
        { status: 'cancelled' },
        now,
      );

      // Assert
      expect(result).toEqual({ type: 'invalidTransition' });
      expect(repo.cancel).not.toHaveBeenCalled();
    });

    it('cancel が null を返す場合（complete との並行実行に負けた場合）は invalidTransition を返す', async () => {
      // Arrange
      const now = new Date(2025, 5, 1, 10, 0, 0);
      const repo = makeRepo({
        findStatusFields: vi.fn().mockResolvedValue({
          isPublished: true,
          scheduledAt: new Date(2025, 5, 1, 0, 0, 0),
          completedAt: null,
          cancelledAt: null,
        }),
        cancel: vi.fn().mockResolvedValue(null),
      });

      // Act
      const result = await updateGameSessionStatus(
        repo,
        'session-1',
        'user-1',
        { status: 'cancelled' },
        now,
      );

      // Assert
      expect(result).toEqual({ type: 'invalidTransition' });
    });
  });

  describe('権限・存在チェック', () => {
    it('セッションが存在しない場合は notFound を返す', async () => {
      // Arrange
      const repo = makeRepo({
        findHostUserId: vi.fn().mockResolvedValue(null),
      });

      // Act
      const result = await updateGameSessionStatus(
        repo,
        'nonexistent',
        'user-1',
        { status: 'open' },
      );

      // Assert
      expect(result).toEqual({ type: 'notFound' });
    });

    it('ホストでないユーザーは forbidden を返す', async () => {
      // Arrange
      const repo = makeRepo({
        findHostUserId: vi.fn().mockResolvedValue('user-1'),
      });

      // Act
      const result = await updateGameSessionStatus(
        repo,
        'session-1',
        'user-other',
        { status: 'open' },
      );

      // Assert
      expect(result).toEqual({ type: 'forbidden' });
    });

    it('publish が null を返す場合は notFound を返す', async () => {
      // Arrange
      const repo = makeRepo({
        publish: vi.fn().mockResolvedValue(null),
      });

      // Act
      const result = await updateGameSessionStatus(
        repo,
        'session-1',
        'user-1',
        { status: 'open' },
      );

      // Assert
      expect(result).toEqual({ type: 'notFound' });
    });
  });
});
