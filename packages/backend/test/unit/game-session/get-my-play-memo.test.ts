import { describe, expect, it, vi } from 'vitest';
import { getMyPlayMemo } from '@/game-session/application/get-my-play-memo';
import type { GetMyPlayMemoRepository } from '@/game-session/application/get-my-play-memo';
import type { GameSessionPlayMemo } from '@taku-biyori/shared';

const mockPlayMemo: GameSessionPlayMemo = {
  seatId: 'member-1',
  body: '今日のセッションのメモ',
  sharedAt: null,
  updatedAt: '2026-08-02T00:00:00.000Z',
};

const makeRepo = (
  overrides: Partial<GetMyPlayMemoRepository> = {},
): GetMyPlayMemoRepository => ({
  gameSessionExists: vi.fn().mockResolvedValue(true),
  findSeatByUserId: vi.fn().mockResolvedValue('member-1'),
  findPlayMemoBySeatId: vi.fn().mockResolvedValue(mockPlayMemo),
  ...overrides,
});

describe('getMyPlayMemo', () => {
  it('メンバーは自分のメモを取得できる', async () => {
    // Arrange
    const repo = makeRepo();

    // Act
    const result = await getMyPlayMemo(repo, 'session-1', 'user-1');

    // Assert
    expect(result).toEqual({ type: 'ok', playMemo: mockPlayMemo });
  });

  // 未作成と取得エラーをフロントで分岐させないため 404 にしない（design-v1.2 §8）
  it('メモ未作成でも notFound ではなく空メモを返す', async () => {
    // Arrange
    const repo = makeRepo({
      findPlayMemoBySeatId: vi.fn().mockResolvedValue(null),
    });

    // Act
    const result = await getMyPlayMemo(repo, 'session-1', 'user-1');

    // Assert
    expect(result).toEqual({
      type: 'ok',
      playMemo: {
        seatId: 'member-1',
        body: '',
        sharedAt: null,
        updatedAt: null,
      },
    });
  });

  it('卓が存在しないと notFound を返す', async () => {
    // Arrange
    const repo = makeRepo({
      gameSessionExists: vi.fn().mockResolvedValue(false),
    });

    // Act
    const result = await getMyPlayMemo(repo, 'nonexistent', 'user-1');

    // Assert
    expect(result).toEqual({ type: 'notFound' });
  });

  // ゲストは user_id = null のためこの検索に構造上ヒットしない（design-v1.2 §4）。
  // ゲスト除外の専用分岐は書かない
  it('その卓のメンバーでないユーザーには forbidden を返す', async () => {
    // Arrange
    const repo = makeRepo({
      findSeatByUserId: vi.fn().mockResolvedValue(null),
    });

    // Act
    const result = await getMyPlayMemo(repo, 'session-1', 'user-9');

    // Assert
    expect(result).toEqual({ type: 'forbidden' });
  });

  it('卓が存在しないときはメンバー検索もメモ取得も行わない', async () => {
    // Arrange
    const repo = makeRepo({
      gameSessionExists: vi.fn().mockResolvedValue(false),
    });

    // Act
    await getMyPlayMemo(repo, 'nonexistent', 'user-1');

    // Assert
    expect(repo.findSeatByUserId).not.toHaveBeenCalled();
    expect(repo.findPlayMemoBySeatId).not.toHaveBeenCalled();
  });
});
