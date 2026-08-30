import { describe, expect, it, vi } from 'vitest';
import { deleteGameSession } from '@/game-session/application/delete-game-session';
import type { DeleteGameSessionRepository } from '@/game-session/application/delete-game-session';

const LOBBY_ID = 'lobby-1';
const HOST = 'user-host';
const CANCELLED = {
  scheduledAt: '2026-09-01',
  completedAt: null,
  cancelledAt: new Date('2026-08-20T00:00:00.000Z'),
};
const SCHEDULED = {
  scheduledAt: '2026-09-01',
  completedAt: null,
  cancelledAt: null,
};

const makeRepo = (
  overrides: Partial<DeleteGameSessionRepository> = {},
): DeleteGameSessionRepository => {
  const repo: DeleteGameSessionRepository = {
    findLobbyId: vi.fn().mockResolvedValue(LOBBY_ID),
    findHostUserId: vi.fn().mockResolvedValue(HOST),
    findStatusFields: vi.fn().mockResolvedValue(CANCELLED),
    countOtherSeats: vi.fn().mockResolvedValue(0),
    deleteById: vi.fn().mockResolvedValue(undefined),
    executeWithLock: vi.fn(async (_id, fn) => fn(repo)),
    ...overrides,
  };
  return repo;
};

describe('deleteGameSession', () => {
  it('中止した開催は削除できる', async () => {
    // Arrange
    const repo = makeRepo({ countOtherSeats: vi.fn().mockResolvedValue(3) });

    // Act
    const result = await deleteGameSession(repo, LOBBY_ID, 'session-1', HOST);

    // Assert
    expect(result).toEqual({ type: 'ok' });
    expect(repo.deleteById).toHaveBeenCalledWith('session-1');
  });

  it('中止していなくても着席者がホストだけなら削除できる', async () => {
    // Arrange
    // 間違って作った開催の後始末。件数条件なのでポリシー表ではなくここで判定する（§4-5）
    const repo = makeRepo({
      findStatusFields: vi.fn().mockResolvedValue(SCHEDULED),
      countOtherSeats: vi.fn().mockResolvedValue(0),
    });

    // Act
    const result = await deleteGameSession(repo, LOBBY_ID, 'session-1', HOST);

    // Assert
    expect(result).toEqual({ type: 'ok' });
  });

  it('中止しておらず他の着席者がいれば hasSeat を返す', async () => {
    // Arrange
    const repo = makeRepo({
      findStatusFields: vi.fn().mockResolvedValue(SCHEDULED),
      countOtherSeats: vi.fn().mockResolvedValue(2),
    });

    // Act
    const result = await deleteGameSession(repo, LOBBY_ID, 'session-1', HOST);

    // Assert
    expect(result).toEqual({ type: 'hasSeat' });
    expect(repo.deleteById).not.toHaveBeenCalled();
  });

  it('ホスト以外は forbidden を返す', async () => {
    // Arrange
    const repo = makeRepo();

    // Act
    const result = await deleteGameSession(repo, LOBBY_ID, 'session-1', 'user-2');

    // Assert
    expect(result).toEqual({ type: 'forbidden' });
  });

  it('存在しなければ notFound を返す', async () => {
    // Arrange
    const repo = makeRepo({ findLobbyId: vi.fn().mockResolvedValue(null) });

    // Act
    const result = await deleteGameSession(repo, LOBBY_ID, 'session-1', HOST);

    // Assert
    expect(result).toEqual({ type: 'notFound' });
  });

  it('URL の lobbyId が所属ロビーと違えば notFound を返す', async () => {
    // Arrange
    const repo = makeRepo();

    // Act
    const result = await deleteGameSession(repo, 'lobby-other', 'session-1', HOST);

    // Assert
    expect(result).toEqual({ type: 'notFound' });
  });

  it('検証と削除をロックの内側で実行する（TOCTOU 対策）', async () => {
    // Arrange
    const repo = makeRepo();

    // Act
    await deleteGameSession(repo, LOBBY_ID, 'session-1', HOST);

    // Assert
    expect(repo.executeWithLock).toHaveBeenCalledWith(
      'session-1',
      expect.any(Function),
    );
  });
});
