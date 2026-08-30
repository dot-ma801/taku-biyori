import { describe, expect, it, vi } from 'vitest';
import { listSchedulePolls } from '@/lobby/application/list-schedule-polls';
import type { ListSchedulePollsRepository } from '@/lobby/application/list-schedule-polls';
import type { LobbySchedulePollSummary } from '@taku-biyori/shared';

const mockPolls: LobbySchedulePollSummary[] = [
  { id: 'poll-2', createdAt: '2026-08-02T00:00:00.000Z' },
  { id: 'poll-1', createdAt: '2026-08-01T00:00:00.000Z' },
];

const makeRepo = (
  overrides: Partial<ListSchedulePollsRepository> = {},
): ListSchedulePollsRepository => ({
  findLobbyVisibility: vi.fn().mockResolvedValue({
    publishedAt: new Date('2026-08-01T00:00:00.000Z'),
    hostUserId: 'user-1',
  }),
  findSchedulePollSummaries: vi.fn().mockResolvedValue(mockPolls),
  ...overrides,
});

describe('listSchedulePolls', () => {
  it('募集枠の日程調整履歴一覧を返す', async () => {
    // Arrange
    const repo = makeRepo();

    // Act
    const result = await listSchedulePolls(repo, 'lobby-1', 'user-1');

    // Assert
    expect(result).toEqual({ type: 'ok', polls: mockPolls });
  });

  it('存在しない募集枠IDは notFound を返す', async () => {
    // Arrange
    const repo = makeRepo({
      findLobbyVisibility: vi.fn().mockResolvedValue(null),
    });

    // Act
    const result = await listSchedulePolls(repo, 'nonexistent', 'user-1');

    // Assert
    expect(result).toEqual({ type: 'notFound' });
  });

  it('非公開募集枠にホスト以外がアクセスすると forbidden を返す', async () => {
    // Arrange
    const repo = makeRepo({
      findLobbyVisibility: vi
        .fn()
        .mockResolvedValue({ publishedAt: null, hostUserId: 'user-1' }),
    });

    // Act
    const result = await listSchedulePolls(repo, 'lobby-1', 'user-2');

    // Assert
    expect(result).toEqual({ type: 'forbidden' });
  });

  it('非公開募集枠でもホスト本人は閲覧できる', async () => {
    // Arrange
    const repo = makeRepo({
      findLobbyVisibility: vi
        .fn()
        .mockResolvedValue({ publishedAt: null, hostUserId: 'user-1' }),
    });

    // Act
    const result = await listSchedulePolls(repo, 'lobby-1', 'user-1');

    // Assert
    expect(result).toEqual({ type: 'ok', polls: mockPolls });
  });

  it('日程調整が1件もなければ空配列を返す', async () => {
    // Arrange
    const repo = makeRepo({
      findSchedulePollSummaries: vi.fn().mockResolvedValue([]),
    });

    // Act
    const result = await listSchedulePolls(repo, 'lobby-1', 'user-1');

    // Assert
    expect(result).toEqual({ type: 'ok', polls: [] });
  });

  it('募集枠が存在する場合 findSchedulePollSummaries を呼ぶ', async () => {
    // Arrange
    const findSchedulePollSummaries = vi.fn().mockResolvedValue([]);
    const repo = makeRepo({ findSchedulePollSummaries });

    // Act
    await listSchedulePolls(repo, 'lobby-99', 'user-1');

    // Assert
    expect(findSchedulePollSummaries).toHaveBeenCalledWith('lobby-99');
  });
});
