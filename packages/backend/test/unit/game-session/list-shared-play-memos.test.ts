import { describe, expect, it, vi } from 'vitest';
import { listSharedPlayMemos } from '@/game-session/application/list-shared-play-memos';
import type { ListSharedPlayMemosRepository } from '@/game-session/application/list-shared-play-memos';
import type { SharedGameSessionPlayMemo } from '@taku-biyori/shared';

const now = new Date('2026-08-02T12:00:00.000Z');

const sharedPlayMemos: SharedGameSessionPlayMemo[] = [
  {
    memberId: 'member-1',
    body: '一人目のメモ',
    sharedAt: '2026-08-02T10:00:00.000Z',
    updatedAt: '2026-08-02T10:00:00.000Z',
  },
  {
    memberId: 'member-2',
    body: '二人目のメモ',
    sharedAt: '2026-08-02T11:00:00.000Z',
    updatedAt: '2026-08-02T11:00:00.000Z',
  },
];

/** 公開済みかつ完了した卓（ステータスは completed に導出される） */
const completedFields = {
  isPublished: true,
  scheduledAt: new Date('2026-08-01T00:00:00.000Z'),
  completedAt: new Date('2026-08-02T00:00:00.000Z'),
  cancelledAt: null,
};

const makeRepo = (
  overrides: Partial<ListSharedPlayMemosRepository> = {},
): ListSharedPlayMemosRepository => ({
  findStatusFields: vi.fn().mockResolvedValue(completedFields),
  findHostUserId: vi.fn().mockResolvedValue('host-1'),
  findSharedPlayMemos: vi.fn().mockResolvedValue(sharedPlayMemos),
  ...overrides,
});

describe('listSharedPlayMemos', () => {
  it('完了した卓では公開済みメモを全件返す', async () => {
    // Arrange
    const repo = makeRepo();

    // Act
    const result = await listSharedPlayMemos(repo, 'session-1', 'user-9', now);

    // Assert
    expect(result).toEqual({ type: 'ok', playMemos: sharedPlayMemos });
    expect(repo.findSharedPlayMemos).toHaveBeenCalledWith('session-1');
  });

  it('中止された卓でも公開済みメモを返す', async () => {
    // Arrange
    const repo = makeRepo({
      findStatusFields: vi.fn().mockResolvedValue({
        ...completedFields,
        completedAt: null,
        cancelledAt: new Date('2026-08-02T00:00:00.000Z'),
      }),
    });

    // Act
    const result = await listSharedPlayMemos(repo, 'session-1', 'user-9', now);

    // Assert
    expect(result).toEqual({ type: 'ok', playMemos: sharedPlayMemos });
  });

  it('卓が存在しないと notFound を返す', async () => {
    // Arrange
    const repo = makeRepo({
      findStatusFields: vi.fn().mockResolvedValue(null),
    });

    // Act
    const result = await listSharedPlayMemos(
      repo,
      'nonexistent',
      'user-1',
      now,
    );

    // Assert
    expect(result).toEqual({ type: 'notFound' });
  });

  // ⚠️ 非公開のまま中止された卓は cancelled に導出される（cancelled_at が draft より優先）。
  // 卓の公開制御を先に噛ませないと、非公開卓のメモが第三者に読める（design-v1.2 §4 手順2）
  it('非公開のまま中止された卓は、ホスト以外に forbidden を返す', async () => {
    // Arrange
    const repo = makeRepo({
      findStatusFields: vi.fn().mockResolvedValue({
        isPublished: false,
        scheduledAt: new Date('2026-08-01T00:00:00.000Z'),
        completedAt: null,
        cancelledAt: new Date('2026-08-02T00:00:00.000Z'),
      }),
    });

    // Act
    const result = await listSharedPlayMemos(repo, 'session-1', 'user-9', now);

    // Assert
    expect(result).toEqual({ type: 'forbidden' });
    expect(repo.findSharedPlayMemos).not.toHaveBeenCalled();
  });

  it('非公開の卓は未ログインの閲覧者にも forbidden を返す', async () => {
    // Arrange
    const repo = makeRepo({
      findStatusFields: vi.fn().mockResolvedValue({
        isPublished: false,
        scheduledAt: new Date('2026-08-01T00:00:00.000Z'),
        completedAt: null,
        cancelledAt: new Date('2026-08-02T00:00:00.000Z'),
      }),
    });

    // Act
    const result = await listSharedPlayMemos(repo, 'session-1', null, now);

    // Assert
    expect(result).toEqual({ type: 'forbidden' });
  });

  it('非公開のまま中止された卓でも、ホストは公開済みメモを取得できる', async () => {
    // Arrange
    const repo = makeRepo({
      findStatusFields: vi.fn().mockResolvedValue({
        isPublished: false,
        scheduledAt: new Date('2026-08-01T00:00:00.000Z'),
        completedAt: null,
        cancelledAt: new Date('2026-08-02T00:00:00.000Z'),
      }),
    });

    // Act
    const result = await listSharedPlayMemos(repo, 'session-1', 'host-1', now);

    // Assert
    expect(result).toEqual({ type: 'ok', playMemos: sharedPlayMemos });
  });

  // 完了・中止前は他人のメモを見せない（要求 §3-3）
  it('確定済み（confirmed）の卓では空配列を返す', async () => {
    // Arrange
    const repo = makeRepo({
      findStatusFields: vi.fn().mockResolvedValue({
        isPublished: true,
        scheduledAt: new Date('2026-09-01T00:00:00.000Z'),
        completedAt: null,
        cancelledAt: null,
      }),
    });

    // Act
    const result = await listSharedPlayMemos(repo, 'session-1', 'user-1', now);

    // Assert
    expect(result).toEqual({ type: 'ok', playMemos: [] });
    expect(repo.findSharedPlayMemos).not.toHaveBeenCalled();
  });

  it('当日（today）の卓でも空配列を返す', async () => {
    // Arrange
    const repo = makeRepo({
      findStatusFields: vi.fn().mockResolvedValue({
        isPublished: true,
        scheduledAt: now,
        completedAt: null,
        cancelledAt: null,
      }),
    });

    // Act
    const result = await listSharedPlayMemos(repo, 'session-1', 'user-1', now);

    // Assert
    expect(result).toEqual({ type: 'ok', playMemos: [] });
  });

  // 未公開（draft）の卓はホストのみ到達できるが、ステータスが completed / cancelled でないため空配列
  it('draft の卓ではホストにも空配列を返す', async () => {
    // Arrange
    const repo = makeRepo({
      findStatusFields: vi.fn().mockResolvedValue({
        isPublished: false,
        scheduledAt: new Date('2026-09-01T00:00:00.000Z'),
        completedAt: null,
        cancelledAt: null,
      }),
    });

    // Act
    const result = await listSharedPlayMemos(repo, 'session-1', 'host-1', now);

    // Assert
    expect(result).toEqual({ type: 'ok', playMemos: [] });
  });

  // 閲覧者による分岐を作らない（分岐のある権限フィルタは漏洩バグの温床。design-v1.2 §4）
  it('閲覧者が誰であっても同じ一覧を返す', async () => {
    // Arrange
    const repo = makeRepo();

    // Act
    const asHost = await listSharedPlayMemos(repo, 'session-1', 'host-1', now);
    const asMember = await listSharedPlayMemos(
      repo,
      'session-1',
      'member-user-1',
      now,
    );
    const asAnonymous = await listSharedPlayMemos(repo, 'session-1', null, now);

    // Assert
    expect(asHost).toEqual(asMember);
    expect(asMember).toEqual(asAnonymous);
  });

  // 一覧の取得条件に閲覧者を渡すと、閲覧者による分岐が生まれる
  it('メモの検索に閲覧者を渡さない', async () => {
    // Arrange
    const repo = makeRepo();

    // Act
    await listSharedPlayMemos(repo, 'session-1', 'user-9', now);

    // Assert
    expect(repo.findSharedPlayMemos).toHaveBeenCalledWith('session-1');
  });
});
