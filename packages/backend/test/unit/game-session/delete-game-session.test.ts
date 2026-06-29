import { describe, expect, it, vi } from 'vitest';
import { deleteGameSession } from '@/game-session/application/delete-game-session';
import type { DeleteGameSessionRepository } from '@/game-session/application/delete-game-session';
import { GameSessionStatus } from '@taku-biyori/shared';

// makeRepo:
// `executeWithLock` のモックは「コールバックを同期的にそのまま実行する」スタブを既定とする。
// 実 DB ではここでトランザクション境界 + 行ロックが張られるが、ユニットテストでは
// application 層の判定ロジックが lockedRepo 経由で正しく走ることだけ検証したいため
// トランザクションの中身は素通しで良い。
function makeRepo(
  overrides: Partial<DeleteGameSessionRepository> = {},
): DeleteGameSessionRepository {
  const repo: DeleteGameSessionRepository = {
    findHostUserId: vi.fn().mockResolvedValue('user-1'),
    findGameSessionStatus: vi.fn().mockResolvedValue(GameSessionStatus.draft),
    countOtherMembers: vi.fn().mockResolvedValue(0),
    deleteById: vi.fn().mockResolvedValue(undefined),
    executeWithLock: vi.fn(async (_id, fn) => fn(repo)),
    ...overrides,
  };
  return repo;
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

  describe('TOCTOU 対策（トランザクション + 行ロック）', () => {
    it('検証と削除を `executeWithLock` の中で 1 回のスコープにまとめる', async () => {
      // Arrange
      const repo = makeRepo();

      // Act
      await deleteGameSession(repo, 'session-1', 'user-1');

      // Assert: トランザクション境界は session-1 に対して 1 回だけ開く
      expect(repo.executeWithLock).toHaveBeenCalledTimes(1);
      expect(repo.executeWithLock).toHaveBeenCalledWith(
        'session-1',
        expect.any(Function),
      );
    });

    it('`executeWithLock` が結果を返したらその値をそのまま返す', async () => {
      // Arrange
      // ロックが取れずに早期 return するなど、infra 側で完結するケースを想定し
      // コールバックを評価せず固定の結果を返すスタブを差し込む。
      const repo = makeRepo({
        executeWithLock: vi
          .fn()
          .mockResolvedValue({ type: 'notFound' } as const),
      });

      // Act
      const result = await deleteGameSession(repo, 'session-1', 'user-1');

      // Assert: コールバックが評価されなければ内部の検証もすべてスキップされる
      expect(result).toEqual({ type: 'notFound' });
      expect(repo.findHostUserId).not.toHaveBeenCalled();
      expect(repo.findGameSessionStatus).not.toHaveBeenCalled();
      expect(repo.countOtherMembers).not.toHaveBeenCalled();
      expect(repo.deleteById).not.toHaveBeenCalled();
    });
  });
});
