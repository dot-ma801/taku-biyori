import { describe, expect, it, vi } from 'vitest';
import { deleteGameSession } from '@/game-session/application/delete-game-session';
import type { DeleteGameSessionRepository } from '@/game-session/application/delete-game-session';
import { GameSessionStatus } from '@taku-biyori/shared';

function makeRepo(
  overrides: Partial<DeleteGameSessionRepository> = {},
): DeleteGameSessionRepository {
  return {
    findHostUserId: vi.fn().mockResolvedValue('user-1'),
    findGameSessionStatus: vi.fn().mockResolvedValue(GameSessionStatus.draft),
    countOtherMembers: vi.fn().mockResolvedValue(0),
    deleteById: vi.fn().mockResolvedValue(undefined),
    ...overrides,
  };
}

describe('deleteGameSession', () => {
  it('ホストが削除すると ok を返す', async () => {
    // Arrange
    const repo = makeRepo();

    // Act
    const result = await deleteGameSession(repo, 'session-1', 'user-1');

    // Assert
    expect(result).toEqual({ type: 'ok' });
    expect(repo.deleteById).toHaveBeenCalledWith('session-1');
  });

  it('ホストでないユーザーは forbidden を返す', async () => {
    // Arrange
    const repo = makeRepo({
      findHostUserId: vi.fn().mockResolvedValue('user-1'),
      deleteById: vi.fn(),
    });

    // Act
    const result = await deleteGameSession(repo, 'session-1', 'user-other');

    // Assert
    expect(result).toEqual({ type: 'forbidden' });
    expect(repo.deleteById).not.toHaveBeenCalled();
  });

  it('セッションが存在しない場合は notFound を返す', async () => {
    // Arrange
    const repo = makeRepo({
      findHostUserId: vi.fn().mockResolvedValue(null),
      deleteById: vi.fn(),
    });

    // Act
    const result = await deleteGameSession(repo, 'nonexistent', 'user-1');

    // Assert
    expect(result).toEqual({ type: 'notFound' });
    expect(repo.deleteById).not.toHaveBeenCalled();
  });

  it('status が open のときも ok を返す', async () => {
    // Arrange
    const repo = makeRepo({
      findGameSessionStatus: vi.fn().mockResolvedValue(GameSessionStatus.open),
    });

    // Act
    const result = await deleteGameSession(repo, 'session-1', 'user-1');

    // Assert
    expect(result).toEqual({ type: 'ok' });
  });

  it('status が scheduling のときも ok を返す', async () => {
    // Arrange
    const repo = makeRepo({
      findGameSessionStatus: vi
        .fn()
        .mockResolvedValue(GameSessionStatus.scheduling),
    });

    // Act
    const result = await deleteGameSession(repo, 'session-1', 'user-1');

    // Assert
    expect(result).toEqual({ type: 'ok' });
  });

  it('status が confirmed のとき invalidStatus を返す', async () => {
    // Arrange
    const repo = makeRepo({
      findGameSessionStatus: vi
        .fn()
        .mockResolvedValue(GameSessionStatus.confirmed),
      deleteById: vi.fn(),
    });

    // Act
    const result = await deleteGameSession(repo, 'session-1', 'user-1');

    // Assert
    expect(result).toEqual({ type: 'invalidStatus' });
    expect(repo.deleteById).not.toHaveBeenCalled();
  });

  it('status が today のとき invalidStatus を返す', async () => {
    // Arrange
    const repo = makeRepo({
      findGameSessionStatus: vi.fn().mockResolvedValue(GameSessionStatus.today),
      deleteById: vi.fn(),
    });

    // Act
    const result = await deleteGameSession(repo, 'session-1', 'user-1');

    // Assert
    expect(result).toEqual({ type: 'invalidStatus' });
    expect(repo.deleteById).not.toHaveBeenCalled();
  });

  it('status が completed のとき invalidStatus を返す', async () => {
    // Arrange
    const repo = makeRepo({
      findGameSessionStatus: vi
        .fn()
        .mockResolvedValue(GameSessionStatus.completed),
      deleteById: vi.fn(),
    });

    // Act
    const result = await deleteGameSession(repo, 'session-1', 'user-1');

    // Assert
    expect(result).toEqual({ type: 'invalidStatus' });
    expect(repo.deleteById).not.toHaveBeenCalled();
  });

  it('自分以外のメンバーが存在するとき hasMember を返す', async () => {
    // Arrange
    const repo = makeRepo({
      countOtherMembers: vi.fn().mockResolvedValue(1),
      deleteById: vi.fn(),
    });

    // Act
    const result = await deleteGameSession(repo, 'session-1', 'user-1');

    // Assert
    expect(result).toEqual({ type: 'hasMember' });
    expect(repo.deleteById).not.toHaveBeenCalled();
  });
});
