import { describe, expect, it, vi } from 'vitest';
import { listEntries } from '@/lobby/application/list-entries';
import type { ListEntriesRepository } from '@/lobby/application/list-entries';
import type { LobbyEntry } from '@taku-biyori/shared';

const mockMember: LobbyEntry = {
  id: 'member-1',
  userId: 'user-1',
  userName: 'テストユーザー',
  guestName: null,
  joinedAt: '2025-01-01T00:00:00.000Z',
  leftAt: null,
};

const makeRepo = (
  overrides: Partial<ListEntriesRepository> = {},
): ListEntriesRepository => ({
  findLobbyVisibility: vi.fn().mockResolvedValue({
    publishedAt: new Date('2026-08-01T00:00:00.000Z'),
    hostUserId: 'user-1',
  }),
  findEntriesByLobbyId: vi.fn().mockResolvedValue([mockMember]),
  ...overrides,
});

describe('listEntries', () => {
  it('公開済みロビーは未認証でも参加者一覧を返す', async () => {
    // Arrange
    const repo = makeRepo();

    // Act
    const result = await listEntries(repo, 'lobby-1', null);

    // Assert
    expect(result).toEqual({ type: 'ok', entries: [mockMember] });
  });

  it('存在しない募集枠IDは notFound を返す', async () => {
    // Arrange
    const repo = makeRepo({
      findLobbyVisibility: vi.fn().mockResolvedValue(null),
    });

    // Act
    const result = await listEntries(repo, 'nonexistent', null);

    // Assert
    expect(result).toEqual({ type: 'notFound' });
  });

  it('参加者がいない場合は空配列を返す', async () => {
    // Arrange
    const repo = makeRepo({
      findEntriesByLobbyId: vi.fn().mockResolvedValue([]),
    });

    // Act
    const result = await listEntries(repo, 'lobby-1', 'user-1');

    // Assert
    expect(result).toEqual({ type: 'ok', entries: [] });
  });

  it('未公開ロビーにホストがアクセスすると参加者一覧を返す', async () => {
    // Arrange
    const repo = makeRepo({
      findLobbyVisibility: vi
        .fn()
        .mockResolvedValue({ publishedAt: null, hostUserId: 'user-1' }),
    });

    // Act
    const result = await listEntries(repo, 'lobby-1', 'user-1');

    // Assert
    expect(result).toEqual({ type: 'ok', entries: [mockMember] });
  });

  it('未公開ロビーにホスト以外がアクセスすると forbidden を返す', async () => {
    // Arrange
    const repo = makeRepo({
      findLobbyVisibility: vi
        .fn()
        .mockResolvedValue({ publishedAt: null, hostUserId: 'user-1' }),
    });

    // Act
    const result = await listEntries(repo, 'lobby-1', 'other-user');

    // Assert
    expect(result).toEqual({ type: 'forbidden' });
  });

  it('非公開募集枠に未認証でアクセスすると forbidden を返す', async () => {
    // Arrange
    const repo = makeRepo({
      findLobbyVisibility: vi
        .fn()
        .mockResolvedValue({ publishedAt: null, hostUserId: 'user-1' }),
    });

    // Act
    const result = await listEntries(repo, 'lobby-1', null);

    // Assert
    expect(result).toEqual({ type: 'forbidden' });
  });
});
