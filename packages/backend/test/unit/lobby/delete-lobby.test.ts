import { describe, expect, it, vi } from 'vitest';
import { deleteLobby } from '@/lobby/application/delete-lobby';
import type { DeleteLobbyRepository } from '@/lobby/application/delete-lobby';

// makeRepo:
// `executeWithLock` のモックは「コールバックを同期的にそのまま実行する」スタブを既定とする。
// 実 DB ではここでトランザクション境界 + 行ロックが張られるが、ユニットテストでは
// application 層の判定ロジックが lockedRepo 経由で正しく走ることだけ検証したいため
// トランザクションの中身は素通しで良い（既存 game-session の deleteGameSession と同方針）。
function makeRepo(
  overrides: Partial<DeleteLobbyRepository> = {},
): DeleteLobbyRepository {
  const repo: DeleteLobbyRepository = {
    findHostUserId: vi.fn().mockResolvedValue('user-1'),
    countOtherEntries: vi.fn().mockResolvedValue(0),
    countGameSessions: vi.fn().mockResolvedValue(0),
    deleteById: vi.fn().mockResolvedValue(undefined),
    executeWithLock: vi.fn(async (_id, fn) => fn(repo)),
    ...overrides,
  };
  return repo;
}

describe('deleteLobby', () => {
  it('ホストが削除すると ok を返す', async () => {
    // Arrange
    const repo = makeRepo();

    // Act
    const result = await deleteLobby(repo, 'lobby-1', 'user-1');

    // Assert
    expect(result).toEqual({ type: 'ok' });
    expect(repo.deleteById).toHaveBeenCalledWith('lobby-1');
  });

  it('ホストでないユーザーは forbidden を返す', async () => {
    // Arrange
    const repo = makeRepo({ deleteById: vi.fn() });

    // Act
    const result = await deleteLobby(repo, 'lobby-1', 'user-other');

    // Assert
    expect(result).toEqual({ type: 'forbidden' });
    expect(repo.deleteById).not.toHaveBeenCalled();
  });

  it('ロビーが存在しない場合は notFound を返す', async () => {
    // Arrange
    const repo = makeRepo({
      findHostUserId: vi.fn().mockResolvedValue(null),
      deleteById: vi.fn(),
    });

    // Act
    const result = await deleteLobby(repo, 'nonexistent', 'user-1');

    // Assert
    expect(result).toEqual({ type: 'notFound' });
    expect(repo.deleteById).not.toHaveBeenCalled();
  });

  it('自分以外のメンバーが存在するとき hasMember を返す', async () => {
    // Arrange
    const repo = makeRepo({
      countOtherEntries: vi.fn().mockResolvedValue(1),
      deleteById: vi.fn(),
    });

    // Act
    const result = await deleteLobby(repo, 'lobby-1', 'user-1');

    // Assert
    expect(result).toEqual({ type: 'hasMember' });
    expect(repo.deleteById).not.toHaveBeenCalled();
  });

  it('開催が1件でもあるとき hasGameSession を返す', async () => {
    // Arrange
    // lobby_id が ON DELETE CASCADE になったため、ロビーを消すと過去の開催記録・
    // 着席・プレイメモまで連鎖して消える（design-v2 §6-13-3）
    const repo = makeRepo({
      countGameSessions: vi.fn().mockResolvedValue(1),
      deleteById: vi.fn(),
    });

    // Act
    const result = await deleteLobby(repo, 'lobby-1', 'user-1');

    // Assert
    expect(result).toEqual({ type: 'hasGameSession' });
    expect(repo.deleteById).not.toHaveBeenCalled();
  });

  it('中止・完了した開催も数に入れる', async () => {
    // Arrange
    // 「終わった開催なら消してよい」ではない。記録として残す（design-v2 §4-4）
    const repo = makeRepo({
      countGameSessions: vi.fn().mockResolvedValue(3),
      deleteById: vi.fn(),
    });

    // Act
    const result = await deleteLobby(repo, 'lobby-1', 'user-1');

    // Assert
    expect(result).toEqual({ type: 'hasGameSession' });
    expect(repo.countGameSessions).toHaveBeenCalledWith('lobby-1');
  });

  describe('TOCTOU 対策（トランザクション + 行ロック）', () => {
    it('検証と削除を `executeWithLock` の中で 1 回のスコープにまとめる', async () => {
      // Arrange
      const repo = makeRepo();

      // Act
      await deleteLobby(repo, 'lobby-1', 'user-1');

      // Assert
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
      const result = await deleteLobby(repo, 'lobby-1', 'user-1');

      // Assert
      expect(result).toEqual({ type: 'notFound' });
      expect(repo.findHostUserId).not.toHaveBeenCalled();
      expect(repo.countOtherEntries).not.toHaveBeenCalled();
      expect(repo.countGameSessions).not.toHaveBeenCalled();
      expect(repo.deleteById).not.toHaveBeenCalled();
    });
  });
});
