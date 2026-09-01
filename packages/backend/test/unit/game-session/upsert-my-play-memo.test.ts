import { describe, expect, it, vi } from 'vitest';
import { upsertMyPlayMemo } from '@/game-session/application/upsert-my-play-memo';
import type { UpsertMyPlayMemoRepository } from '@/game-session/application/upsert-my-play-memo';
import type { GameSessionPlayMemo } from '@taku-biyori/shared';

const TODAY = '2026-08-02';

/** 開催予定（scheduled）のセッション */
const scheduledFields = {
  scheduledAt: '2026-09-01',
  completedAt: null,
  cancelledAt: null,
};

const mockPlayMemo: GameSessionPlayMemo = {
  memberId: 'member-1',
  body: '書き換えたメモ',
  sharedAt: null,
  updatedAt: '2026-08-02T10:00:00.000Z',
};

const makeRepo = (
  overrides: Partial<UpsertMyPlayMemoRepository> = {},
): UpsertMyPlayMemoRepository => ({
  findStatusFields: vi.fn().mockResolvedValue(scheduledFields),
  findHostUserId: vi.fn().mockResolvedValue('user-host'),
  findSeatByUserId: vi.fn().mockResolvedValue('member-1'),
  upsertPlayMemo: vi.fn().mockResolvedValue(mockPlayMemo),
  ...overrides,
});

describe('upsertMyPlayMemo', () => {
  it('メンバーは自分のメモを保存できる', async () => {
    // Arrange
    const repo = makeRepo();

    // Act
    const result = await upsertMyPlayMemo(
      repo,
      'session-1',
      'user-1',
      { body: '書き換えたメモ' },
      TODAY,
    );

    // Assert
    expect(result).toEqual({ type: 'ok', playMemo: mockPlayMemo });
    expect(repo.upsertPlayMemo).toHaveBeenCalledWith(
      'member-1',
      '書き換えたメモ',
    );
  });

  it('ホストも自分のメモを保存できる', async () => {
    // Arrange
    const repo = makeRepo();

    // Act
    const result = await upsertMyPlayMemo(
      repo,
      'session-1',
      'user-host',
      { body: '書き換えたメモ' },
      TODAY,
    );

    // Assert
    expect(result).toEqual({ type: 'ok', playMemo: mockPlayMemo });
  });

  // 本文を空にしても行は残す（公開状態を失わせない。design-v1.2 §8）
  it('空文字の本文も保存できる', async () => {
    // Arrange
    const repo = makeRepo();

    // Act
    const result = await upsertMyPlayMemo(
      repo,
      'session-1',
      'user-1',
      { body: '' },
      TODAY,
    );

    // Assert
    expect(result.type).toBe('ok');
    expect(repo.upsertPlayMemo).toHaveBeenCalledWith('member-1', '');
  });

  it('draft の卓でも保存できる', async () => {
    // Arrange
    const repo = makeRepo({
      findStatusFields: vi
        .fn()
        .mockResolvedValue({ ...scheduledFields, isPublished: false }),
    });

    // Act
    const result = await upsertMyPlayMemo(
      repo,
      'session-1',
      'user-1',
      { body: 'メモ' },
      TODAY,
    );

    // Assert
    expect(result.type).toBe('ok');
  });

  it('当日（today）の卓でも保存できる', async () => {
    // Arrange
    const repo = makeRepo({
      findStatusFields: vi.fn().mockResolvedValue({
        ...scheduledFields,
        scheduledAt: '2026-08-02',
      }),
    });

    // Act
    const result = await upsertMyPlayMemo(
      repo,
      'session-1',
      'user-1',
      { body: 'メモ' },
      TODAY,
    );

    // Assert
    expect(result.type).toBe('ok');
  });

  it('卓が存在しないと notFound を返す', async () => {
    // Arrange
    const repo = makeRepo({
      findStatusFields: vi.fn().mockResolvedValue(null),
    });

    // Act
    const result = await upsertMyPlayMemo(
      repo,
      'nonexistent',
      'user-1',
      { body: 'メモ' },
      TODAY,
    );

    // Assert
    expect(result).toEqual({ type: 'notFound' });
    expect(repo.upsertPlayMemo).not.toHaveBeenCalled();
  });

  // ゲストは user_id = null のためこの検索に構造上ヒットしない（design-v1.2 §4）
  it('その卓のメンバーでないユーザーには forbidden を返す', async () => {
    // Arrange
    const repo = makeRepo({
      findSeatByUserId: vi.fn().mockResolvedValue(null),
    });

    // Act
    const result = await upsertMyPlayMemo(
      repo,
      'session-1',
      'user-9',
      { body: 'メモ' },
      TODAY,
    );

    // Assert
    expect(result).toEqual({ type: 'forbidden' });
    expect(repo.upsertPlayMemo).not.toHaveBeenCalled();
  });

  it('完了した卓では statusLocked を返す', async () => {
    // Arrange
    const repo = makeRepo({
      findStatusFields: vi.fn().mockResolvedValue({
        ...scheduledFields,
        completedAt: new Date('2026-08-01T00:00:00.000Z'),
      }),
    });

    // Act
    const result = await upsertMyPlayMemo(
      repo,
      'session-1',
      'user-1',
      { body: 'メモ' },
      TODAY,
    );

    // Assert
    expect(result).toEqual({ type: 'statusLocked' });
    expect(repo.upsertPlayMemo).not.toHaveBeenCalled();
  });

  it('中止した卓では statusLocked を返す', async () => {
    // Arrange
    const repo = makeRepo({
      findStatusFields: vi.fn().mockResolvedValue({
        ...scheduledFields,
        cancelledAt: new Date('2026-08-01T00:00:00.000Z'),
      }),
    });

    // Act
    const result = await upsertMyPlayMemo(
      repo,
      'session-1',
      'user-1',
      { body: 'メモ' },
      TODAY,
    );

    // Assert
    expect(result).toEqual({ type: 'statusLocked' });
    expect(repo.upsertPlayMemo).not.toHaveBeenCalled();
  });

  // 非メンバーに卓のステータスを推測させない（存在チェックを先に通す設計と対称）
  it('完了した卓でも非メンバーには forbidden を返す', async () => {
    // Arrange
    const repo = makeRepo({
      findStatusFields: vi.fn().mockResolvedValue({
        ...scheduledFields,
        completedAt: new Date('2026-08-01T00:00:00.000Z'),
      }),
      findSeatByUserId: vi.fn().mockResolvedValue(null),
    });

    // Act
    const result = await upsertMyPlayMemo(
      repo,
      'session-1',
      'user-9',
      { body: 'メモ' },
      TODAY,
    );

    // Assert
    expect(result).toEqual({ type: 'forbidden' });
  });
});
