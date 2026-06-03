import { describe, expect, it, vi } from 'vitest';
import { deleteGameSession } from '@/game-session/application/delete-game-session';
import type { DeleteGameSessionRepository } from '@/game-session/application/delete-game-session';

describe('deleteGameSession', () => {
  it('ホストが削除すると ok を返す', async () => {
    // Arrange
    const repo: DeleteGameSessionRepository = {
      findHostUserId: vi.fn().mockResolvedValue('user-1'),
      deleteById: vi.fn().mockResolvedValue(undefined),
    };

    // Act
    const result = await deleteGameSession(repo, 'session-1', 'user-1');

    // Assert
    expect(result).toEqual({ type: 'ok' });
    expect(repo.deleteById).toHaveBeenCalledWith('session-1');
  });

  it('ホストでないユーザーは forbidden を返す', async () => {
    // Arrange
    const repo: DeleteGameSessionRepository = {
      findHostUserId: vi.fn().mockResolvedValue('user-1'),
      deleteById: vi.fn(),
    };

    // Act
    const result = await deleteGameSession(repo, 'session-1', 'user-other');

    // Assert
    expect(result).toEqual({ type: 'forbidden' });
    expect(repo.deleteById).not.toHaveBeenCalled();
  });

  it('セッションが存在しない場合は notFound を返す', async () => {
    // Arrange
    const repo: DeleteGameSessionRepository = {
      findHostUserId: vi.fn().mockResolvedValue(null),
      deleteById: vi.fn(),
    };

    // Act
    const result = await deleteGameSession(repo, 'nonexistent', 'user-1');

    // Assert
    expect(result).toEqual({ type: 'notFound' });
    expect(repo.deleteById).not.toHaveBeenCalled();
  });
});
