import { describe, expect, it, vi } from 'vitest';
import { listSharedPlayMemos } from '@/game-session/application/list-shared-play-memos';
import type { ListSharedPlayMemosRepository } from '@/game-session/application/list-shared-play-memos';
import type { SharedGameSessionPlayMemo } from '@taku-biyori/shared';
import { LobbyStatus } from '@taku-biyori/shared';

const today = '2026-08-02';
const LOBBY_ID = 'lobby-1';

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

/** 完了した開催（ステータスは completed に導出される） */
const completedFields = {
  scheduledAt: '2026-08-01',
  completedAt: new Date('2026-08-02T00:00:00.000Z'),
  cancelledAt: null,
};

/** 公開はロビーの関心事に移ったので、閲覧可否の材料は lobby.status になった（design-v2 §4-2） */
const openLobby = { hostUserId: 'host-1', status: LobbyStatus.open };
const draftLobby = { hostUserId: 'host-1', status: LobbyStatus.draft };

const makeRepo = (
  overrides: Partial<ListSharedPlayMemosRepository> = {},
): ListSharedPlayMemosRepository => ({
  findStatusFields: vi.fn().mockResolvedValue(completedFields),
  findLobbyId: vi.fn().mockResolvedValue(LOBBY_ID),
  findLobbyForViewing: vi.fn().mockResolvedValue(openLobby),
  findSharedPlayMemos: vi.fn().mockResolvedValue(sharedPlayMemos),
  ...overrides,
});

describe('listSharedPlayMemos', () => {
  it('完了した卓では公開済みメモを全件返す', async () => {
    // Arrange
    const repo = makeRepo();

    // Act
    const result = await listSharedPlayMemos(
      repo,
      'session-1',
      'user-9',
      today,
    );

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
    const result = await listSharedPlayMemos(
      repo,
      'session-1',
      'user-9',
      today,
    );

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
      today,
    );

    // Assert
    expect(result).toEqual({ type: 'notFound' });
  });

  // ⚠️ 下書きロビーのまま中止された開催は cancelled に導出される。
  // ロビーの公開制御を先に噛ませないと、下書きロビーのメモが第三者に読める（design-v1.2 §4 手順2）
  it('下書きロビーのまま中止された開催は、ホスト以外に forbidden を返す', async () => {
    // Arrange
    const repo = makeRepo({
      findStatusFields: vi.fn().mockResolvedValue({
        scheduledAt: '2026-08-01',
        completedAt: null,
        cancelledAt: new Date('2026-08-02T00:00:00.000Z'),
      }),
      findLobbyForViewing: vi.fn().mockResolvedValue(draftLobby),
    });

    // Act
    const result = await listSharedPlayMemos(
      repo,
      'session-1',
      'user-9',
      today,
    );

    // Assert
    expect(result).toEqual({ type: 'forbidden' });
    expect(repo.findSharedPlayMemos).not.toHaveBeenCalled();
  });

  it('下書きロビーの開催は未ログインの閲覧者にも forbidden を返す', async () => {
    // Arrange
    const repo = makeRepo({
      findStatusFields: vi.fn().mockResolvedValue({
        scheduledAt: '2026-08-01',
        completedAt: null,
        cancelledAt: new Date('2026-08-02T00:00:00.000Z'),
      }),
      findLobbyForViewing: vi.fn().mockResolvedValue(draftLobby),
    });

    // Act
    const result = await listSharedPlayMemos(repo, 'session-1', null, today);

    // Assert
    expect(result).toEqual({ type: 'forbidden' });
  });

  // v0.2 では findHostUserId の戻り値が string | null で、未ログイン（userId === null）と
  // 重なると `null !== null` が false になりホスト扱いで素通りする穴があった。
  // v2 の LobbySummary は hostUserId が非 null なので、その穴は型で塞がっている。
  // 代わりにロビーが引けないケースを notFound として押さえる
  it('ロビーが引けなければ notFound を返す', async () => {
    // Arrange
    const repo = makeRepo({
      findStatusFields: vi.fn().mockResolvedValue({
        scheduledAt: '2026-08-01',
        completedAt: null,
        cancelledAt: new Date('2026-08-02T00:00:00.000Z'),
      }),
      findLobbyForViewing: vi.fn().mockResolvedValue(null),
    });

    // Act
    const result = await listSharedPlayMemos(repo, 'session-1', null, today);

    // Assert
    expect(result).toEqual({ type: 'notFound' });
    expect(repo.findSharedPlayMemos).not.toHaveBeenCalled();
  });

  it('非公開のまま中止された卓でも、ホストは公開済みメモを取得できる', async () => {
    // Arrange
    const repo = makeRepo({
      findStatusFields: vi.fn().mockResolvedValue({
        scheduledAt: '2026-08-01',
        completedAt: null,
        cancelledAt: new Date('2026-08-02T00:00:00.000Z'),
      }),
    });

    // Act
    const result = await listSharedPlayMemos(
      repo,
      'session-1',
      'host-1',
      today,
    );

    // Assert
    expect(result).toEqual({ type: 'ok', playMemos: sharedPlayMemos });
  });

  // 完了・中止前は他人のメモを見せない（要求 §3-3）
  it('確定済み（confirmed）の卓では空配列を返す', async () => {
    // Arrange
    const repo = makeRepo({
      findStatusFields: vi.fn().mockResolvedValue({
        scheduledAt: '2026-09-01',
        completedAt: null,
        cancelledAt: null,
      }),
    });

    // Act
    const result = await listSharedPlayMemos(
      repo,
      'session-1',
      'user-1',
      today,
    );

    // Assert
    expect(result).toEqual({ type: 'ok', playMemos: [] });
    expect(repo.findSharedPlayMemos).not.toHaveBeenCalled();
  });

  it('当日（today）の卓でも空配列を返す', async () => {
    // Arrange
    const repo = makeRepo({
      findStatusFields: vi.fn().mockResolvedValue({
        scheduledAt: today,
        completedAt: null,
        cancelledAt: null,
      }),
    });

    // Act
    const result = await listSharedPlayMemos(
      repo,
      'session-1',
      'user-1',
      today,
    );

    // Assert
    expect(result).toEqual({ type: 'ok', playMemos: [] });
  });

  // 下書きロビーの開催はホストのみ到達できるが、ステータスが completed / cancelled でないため空配列
  it('下書きロビーの開催ではホストにも空配列を返す', async () => {
    // Arrange
    const repo = makeRepo({
      findStatusFields: vi.fn().mockResolvedValue({
        scheduledAt: '2026-09-01',
        completedAt: null,
        cancelledAt: null,
      }),
    });

    // Act
    const result = await listSharedPlayMemos(
      repo,
      'session-1',
      'host-1',
      today,
    );

    // Assert
    expect(result).toEqual({ type: 'ok', playMemos: [] });
  });

  // 閲覧者による分岐を作らない（分岐のある権限フィルタは漏洩バグの温床。design-v1.2 §4）
  it('閲覧者が誰であっても同じ一覧を返す', async () => {
    // Arrange
    const repo = makeRepo();

    // Act
    const asHost = await listSharedPlayMemos(
      repo,
      'session-1',
      'host-1',
      today,
    );
    const asMember = await listSharedPlayMemos(
      repo,
      'session-1',
      'member-user-1',
      today,
    );
    const asAnonymous = await listSharedPlayMemos(
      repo,
      'session-1',
      null,
      today,
    );

    // Assert
    expect(asHost).toEqual(asMember);
    expect(asMember).toEqual(asAnonymous);
  });

  // 一覧の取得条件に閲覧者を渡すと、閲覧者による分岐が生まれる
  it('メモの検索に閲覧者を渡さない', async () => {
    // Arrange
    const repo = makeRepo();

    // Act
    await listSharedPlayMemos(repo, 'session-1', 'user-9', today);

    // Assert
    expect(repo.findSharedPlayMemos).toHaveBeenCalledWith('session-1');
  });
});
