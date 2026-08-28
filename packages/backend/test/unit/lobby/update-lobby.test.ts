import { describe, expect, it, vi } from 'vitest';
import { updateLobby } from '@/lobby/application/update-lobby';
import type { UpdateLobbyRepository } from '@/lobby/application/update-lobby';
import { LobbyStatus } from '@taku-biyori/shared';
import type { Lobby } from '@taku-biyori/shared';

const mockLobby: Lobby = {
  id: 'lobby-1',
  title: '更新後',
  status: LobbyStatus.draft,
  isPublished: false,
  hostUserId: 'user-1',
  createdAt: '2025-01-01T00:00:00.000Z',
  updatedAt: '2025-01-01T00:00:00.000Z',
};

// makeRepo:
// `executeWithLock` のモックは「コールバックを同期的にそのまま実行する」スタブを既定とする
// （既存 deleteLobby / deleteGameSession のテストと同方針）。
function makeRepo(
  overrides: Partial<UpdateLobbyRepository> = {},
): UpdateLobbyRepository {
  const repo: UpdateLobbyRepository = {
    findHostUserId: vi.fn().mockResolvedValue('user-1'),
    findLobbyStatus: vi.fn().mockResolvedValue(LobbyStatus.draft),
    updateById: vi.fn().mockResolvedValue(mockLobby),
    executeWithLock: vi.fn(async (_id, fn) => fn(repo)),
    ...overrides,
  };
  return repo;
}

describe('updateLobby', () => {
  it('ホストが更新すると ok を返す', async () => {
    // Arrange
    const repo = makeRepo();

    // Act
    const result = await updateLobby(repo, 'lobby-1', 'user-1', {
      title: '更新後',
    });

    // Assert
    expect(result).toEqual({ type: 'ok', lobby: mockLobby });
  });

  it('存在しない場合は notFound を返す', async () => {
    // Arrange
    const repo = makeRepo({ findHostUserId: vi.fn().mockResolvedValue(null) });

    // Act
    const result = await updateLobby(repo, 'nonexistent', 'user-1', {
      title: 'x',
    });

    // Assert
    expect(result).toEqual({ type: 'notFound' });
  });

  it('ホストでない場合は forbidden を返す', async () => {
    // Arrange
    const repo = makeRepo();

    // Act
    const result = await updateLobby(repo, 'lobby-1', 'other-user', {
      title: 'x',
    });

    // Assert
    expect(result).toEqual({ type: 'forbidden' });
  });

  it('confirmed の場合は invalidStatus を返す', async () => {
    // Arrange
    const repo = makeRepo({
      findLobbyStatus: vi.fn().mockResolvedValue(LobbyStatus.confirmed),
      updateById: vi.fn(),
    });

    // Act
    const result = await updateLobby(repo, 'lobby-1', 'user-1', {
      title: 'x',
    });

    // Assert
    expect(result).toEqual({ type: 'invalidStatus' });
    expect(repo.updateById).not.toHaveBeenCalled();
  });

  it('cancelled の場合は invalidStatus を返す', async () => {
    // Arrange
    const repo = makeRepo({
      findLobbyStatus: vi.fn().mockResolvedValue(LobbyStatus.cancelled),
      updateById: vi.fn(),
    });

    // Act
    const result = await updateLobby(repo, 'lobby-1', 'user-1', {
      title: 'x',
    });

    // Assert
    expect(result).toEqual({ type: 'invalidStatus' });
    expect(repo.updateById).not.toHaveBeenCalled();
  });

  it('open の場合は更新できる', async () => {
    // Arrange
    const repo = makeRepo({
      findLobbyStatus: vi.fn().mockResolvedValue(LobbyStatus.open),
    });

    // Act
    const result = await updateLobby(repo, 'lobby-1', 'user-1', {
      title: 'x',
    });

    // Assert
    expect(result).toEqual({ type: 'ok', lobby: mockLobby });
  });

  it('scheduling の場合は更新できる', async () => {
    // Arrange
    const repo = makeRepo({
      findLobbyStatus: vi.fn().mockResolvedValue(LobbyStatus.scheduling),
    });

    // Act
    const result = await updateLobby(repo, 'lobby-1', 'user-1', {
      title: 'x',
    });

    // Assert
    expect(result).toEqual({ type: 'ok', lobby: mockLobby });
  });

  describe('TOCTOU 対策（トランザクション + 行ロック）', () => {
    it('検証と更新を `executeWithLock` の中で 1 回のスコープにまとめる', async () => {
      // Arrange
      const repo = makeRepo();

      // Act
      await updateLobby(repo, 'lobby-1', 'user-1', { title: 'x' });

      // Assert: ステータスチェックと updateById が同一トランザクション内で走る
      expect(repo.executeWithLock).toHaveBeenCalledTimes(1);
      expect(repo.executeWithLock).toHaveBeenCalledWith(
        'lobby-1',
        expect.any(Function),
      );
    });

    it('`executeWithLock` が結果を返したらその値をそのまま返す', async () => {
      // Arrange
      const repo = makeRepo({
        executeWithLock: vi
          .fn()
          .mockResolvedValue({ type: 'notFound' } as const),
      });

      // Act
      const result = await updateLobby(repo, 'lobby-1', 'user-1', {
        title: 'x',
      });

      // Assert: コールバックが評価されなければ内部の検証もすべてスキップされる
      expect(result).toEqual({ type: 'notFound' });
      expect(repo.findHostUserId).not.toHaveBeenCalled();
      expect(repo.findLobbyStatus).not.toHaveBeenCalled();
      expect(repo.updateById).not.toHaveBeenCalled();
    });
  });
});
