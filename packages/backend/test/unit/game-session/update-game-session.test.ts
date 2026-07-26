import { describe, expect, it, vi } from 'vitest';
import { updateGameSession } from '@/game-session/application/update-game-session';
import type { UpdateGameSessionRepository } from '@/game-session/application/update-game-session';
import type { GameSession } from '@taku-biyori/shared';

const mockGameSession: GameSession = {
  id: 'session-1',
  title: '更新後の卓',
  description: null,
  scenarioName: null,
  status: 'draft',
  isPublished: false,
  scheduledAt: '2025-05-30',
  completedAt: null,
  maxMembers: null,
  createdBy: 'user-1',
  createdAt: '2025-01-01T00:00:00.000Z',
  updatedAt: '2025-01-02T00:00:00.000Z',
};

describe('updateGameSession', () => {
  it('ホストが更新すると更新後のセッションを返す', async () => {
    // Arrange
    const repo: UpdateGameSessionRepository = {
      findHostUserId: vi.fn().mockResolvedValue('user-1'),
      updateById: vi.fn().mockResolvedValue(mockGameSession),
    };

    // Act
    const result = await updateGameSession(repo, 'session-1', 'user-1', {
      title: '更新後の卓',
    });

    // Assert
    expect(result).toEqual({ type: 'ok', gameSession: mockGameSession });
  });

  it('ホストでないユーザーは forbidden を返す', async () => {
    // Arrange
    const repo: UpdateGameSessionRepository = {
      findHostUserId: vi.fn().mockResolvedValue('user-1'),
      updateById: vi.fn(),
    };

    // Act
    const result = await updateGameSession(repo, 'session-1', 'user-other', {
      title: '更新後',
    });

    // Assert
    expect(result).toEqual({ type: 'forbidden' });
    expect(repo.updateById).not.toHaveBeenCalled();
  });

  it('セッションが存在しない場合は notFound を返す', async () => {
    // Arrange
    const repo: UpdateGameSessionRepository = {
      findHostUserId: vi.fn().mockResolvedValue(null),
      updateById: vi.fn(),
    };

    // Act
    const result = await updateGameSession(repo, 'nonexistent', 'user-1', {
      title: '更新後',
    });

    // Assert
    expect(result).toEqual({ type: 'notFound' });
    expect(repo.updateById).not.toHaveBeenCalled();
  });

  it('updateById が null を返す場合（並行削除）は notFound を返す', async () => {
    // Arrange
    const repo: UpdateGameSessionRepository = {
      findHostUserId: vi.fn().mockResolvedValue('user-1'),
      updateById: vi.fn().mockResolvedValue(null),
    };

    // Act
    const result = await updateGameSession(repo, 'session-1', 'user-1', {
      title: '更新後',
    });

    // Assert
    expect(result).toEqual({ type: 'notFound' });
  });

  it('updateById に id と入力を渡す', async () => {
    // Arrange
    const updateById = vi.fn().mockResolvedValue(mockGameSession);
    const repo: UpdateGameSessionRepository = {
      findHostUserId: vi.fn().mockResolvedValue('user-1'),
      updateById,
    };

    // Act
    await updateGameSession(repo, 'session-1', 'user-1', {
      title: '新しいタイトル',
      description: '説明文',
    });

    // Assert
    expect(updateById).toHaveBeenCalledWith(
      'session-1',
      expect.objectContaining({
        title: '新しいタイトル',
        description: '説明文',
      }),
    );
  });
});
