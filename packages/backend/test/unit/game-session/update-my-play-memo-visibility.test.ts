import { describe, expect, it, vi } from 'vitest';
import { updateMyPlayMemoVisibility } from '@/game-session/application/update-my-play-memo-visibility';
import type { UpdateMyPlayMemoVisibilityRepository } from '@/game-session/application/update-my-play-memo-visibility';
import type { GameSessionPlayMemo } from '@taku-biyori/shared';

const now = new Date('2026-08-02T12:00:00.000Z');

const sharedPlayMemo: GameSessionPlayMemo = {
  memberId: 'member-1',
  body: '今日のセッションのメモ',
  sharedAt: now.toISOString(),
  updatedAt: now.toISOString(),
};

const makeRepo = (
  overrides: Partial<UpdateMyPlayMemoVisibilityRepository> = {},
): UpdateMyPlayMemoVisibilityRepository => ({
  gameSessionExists: vi.fn().mockResolvedValue(true),
  findSeatByUserId: vi.fn().mockResolvedValue('member-1'),
  updatePlayMemoVisibility: vi.fn().mockResolvedValue(sharedPlayMemo),
  ...overrides,
});

describe('updateMyPlayMemoVisibility', () => {
  it('公開すると shared_at に現在時刻を設定する', async () => {
    // Arrange
    const repo = makeRepo();

    // Act
    const result = await updateMyPlayMemoVisibility(
      repo,
      'session-1',
      'user-1',
      { shared: true },
      now,
    );

    // Assert
    expect(repo.updatePlayMemoVisibility).toHaveBeenCalledWith('member-1', now);
    expect(result).toEqual({ type: 'ok', playMemo: sharedPlayMemo });
  });

  // 公開を取りやめて非公開に戻せる（要求 §3-2）
  it('非公開に戻すと shared_at を null にする', async () => {
    // Arrange
    const unsharedPlayMemo = { ...sharedPlayMemo, sharedAt: null };
    const repo = makeRepo({
      updatePlayMemoVisibility: vi.fn().mockResolvedValue(unsharedPlayMemo),
    });

    // Act
    const result = await updateMyPlayMemoVisibility(
      repo,
      'session-1',
      'user-1',
      { shared: false },
      now,
    );

    // Assert
    expect(repo.updatePlayMemoVisibility).toHaveBeenCalledWith(
      'member-1',
      null,
    );
    expect(result).toEqual({ type: 'ok', playMemo: unsharedPlayMemo });
  });

  it('卓が存在しないと notFound を返す', async () => {
    // Arrange
    const repo = makeRepo({
      gameSessionExists: vi.fn().mockResolvedValue(false),
    });

    // Act
    const result = await updateMyPlayMemoVisibility(
      repo,
      'nonexistent',
      'user-1',
      { shared: true },
      now,
    );

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
    const result = await updateMyPlayMemoVisibility(
      repo,
      'session-1',
      'user-9',
      { shared: true },
      now,
    );

    // Assert
    expect(result).toEqual({ type: 'forbidden' });
  });

  // 本文を一度も保存していないメモを公開する意味がないため（design-v1.2 §5）
  it('メモ未作成なら notFound を返す', async () => {
    // Arrange
    const repo = makeRepo({
      updatePlayMemoVisibility: vi.fn().mockResolvedValue(null),
    });

    // Act
    const result = await updateMyPlayMemoVisibility(
      repo,
      'session-1',
      'user-1',
      { shared: true },
      now,
    );

    // Assert
    expect(result).toEqual({ type: 'notFound' });
  });

  it('卓が存在しないときはメンバー検索も更新も行わない', async () => {
    // Arrange
    const repo = makeRepo({
      gameSessionExists: vi.fn().mockResolvedValue(false),
    });

    // Act
    await updateMyPlayMemoVisibility(
      repo,
      'nonexistent',
      'user-1',
      { shared: true },
      now,
    );

    // Assert
    expect(repo.findSeatByUserId).not.toHaveBeenCalled();
    expect(repo.updatePlayMemoVisibility).not.toHaveBeenCalled();
  });

  // 公開切替は全ステータスで許可する（完了・中止後こそ使われる操作。design-v1.2 §4）。
  // ステータスを読む実装に変わったらこのテストが落ちる。
  // issue #95 の完了条件「完了・中止後も公開切替が 200 で通ること」を担保するのはこのテスト
  // （HTTP 層の統合テストにあった同名の検証はトートロジーだったため削除し、ここに一本化した）
  it('ステータスを一切参照せずに切り替える', async () => {
    // Arrange
    const findStatusFields = vi.fn();
    const repo = { ...makeRepo(), findStatusFields };

    // Act
    const result = await updateMyPlayMemoVisibility(
      repo,
      'session-1',
      'user-1',
      { shared: true },
      now,
    );

    // Assert
    expect(findStatusFields).not.toHaveBeenCalled();
    expect(result).toEqual({ type: 'ok', playMemo: sharedPlayMemo });
  });

  it('メンバーでないときは更新を行わない', async () => {
    // Arrange
    const repo = makeRepo({
      findSeatByUserId: vi.fn().mockResolvedValue(null),
    });

    // Act
    await updateMyPlayMemoVisibility(
      repo,
      'session-1',
      'user-9',
      { shared: true },
      now,
    );

    // Assert
    expect(repo.updatePlayMemoVisibility).not.toHaveBeenCalled();
  });
});
