import { describe, expect, it, vi } from 'vitest';
import { listMyLobbies } from '@/lobby/application/list-my-lobbies';
import type { ListMyLobbiesRepository } from '@/lobby/application/list-my-lobbies';
import type { LobbyListItem } from '@taku-biyori/shared';
import { LobbyStatus } from '@taku-biyori/shared';

const mockListItem: LobbyListItem = {
  id: 'lobby-1',
  title: 'テストロビー',
  status: LobbyStatus.draft,
  publishedAt: null,
  receptionClosedAt: null,
  entries: [],
  hostUserId: 'user-1',
  createdAt: '2025-01-01T00:00:00.000Z',
  updatedAt: '2025-01-01T00:00:00.000Z',
};

describe('listMyLobbies', () => {
  it('リポジトリの結果をそのまま返す', async () => {
    // Arrange
    const repo: ListMyLobbiesRepository = {
      findByUserId: vi.fn().mockResolvedValue([mockListItem]),
    };

    // Act
    const result = await listMyLobbies(repo, 'user-1');

    // Assert
    expect(result).toEqual([mockListItem]);
  });

  it('userId をリポジトリに渡す', async () => {
    // Arrange
    const findByUserId = vi.fn().mockResolvedValue([]);
    const repo: ListMyLobbiesRepository = { findByUserId };

    // Act
    await listMyLobbies(repo, 'user-99');

    // Assert
    expect(findByUserId).toHaveBeenCalledWith('user-99');
  });
});
