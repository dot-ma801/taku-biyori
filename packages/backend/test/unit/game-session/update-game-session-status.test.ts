import { describe, expect, it, vi } from 'vitest';
import { updateGameSessionStatus } from '@/game-session/application/update-game-session-status';
import type { UpdateGameSessionStatusRepository } from '@/game-session/application/update-game-session-status';
import type { GameSession } from '@taku-biyori/shared';

const baseSession: GameSession = {
  id: 'session-1',
  title: 'テスト卓',
  description: null,
  scenarioName: null,
  status: 'draft',
  isPublished: false,
  openUntil: null,
  scheduledAt: null,
  completedAt: null,
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
    openUntil: null,
    scheduledAt: null,
    completedAt: null,
  }),
  publish: vi
    .fn()
    .mockResolvedValue({ ...baseSession, status: 'open', isPublished: true }),
  complete: vi.fn().mockResolvedValue({
    ...baseSession,
    status: 'completed',
    completedAt: '2025-01-01T00:00:00.000Z',
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
          openUntil: null,
          scheduledAt: null,
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
      const now = new Date('2025-06-01T10:00:00.000Z');
      const repo = makeRepo({
        findStatusFields: vi.fn().mockResolvedValue({
          isPublished: true,
          openUntil: null,
          scheduledAt: new Date('2025-06-01'),
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
      const now = new Date('2025-06-01T10:00:00.000Z');
      const repo = makeRepo({
        findStatusFields: vi.fn().mockResolvedValue({
          isPublished: true,
          openUntil: null,
          scheduledAt: new Date('2025-06-01'),
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

    it('today 以外から completed に遷移しようとすると invalidTransition を返す', async () => {
      // Arrange
      const now = new Date('2025-06-01T10:00:00.000Z');
      const repo = makeRepo({
        findStatusFields: vi.fn().mockResolvedValue({
          isPublished: true,
          openUntil: null,
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
