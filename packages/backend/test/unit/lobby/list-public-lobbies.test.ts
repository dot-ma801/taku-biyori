import { describe, expect, it, vi } from 'vitest';
import { listPublicLobbies } from '@/lobby/application/list-public-lobbies';
import type { ListPublicLobbiesRepository } from '@/lobby/application/list-public-lobbies';
import type { LobbyListItem } from '@taku-biyori/shared';
import { LobbyStatus } from '@taku-biyori/shared';

const mockListItem: LobbyListItem = {
  id: 'lobby-1',
  title: '公開ロビー',
  status: LobbyStatus.open,
  publishedAt: '2025-01-01T00:00:00.000Z',
  receptionClosedAt: null,
  entries: [],
  hostUserId: 'user-1',
  createdAt: '2025-01-01T00:00:00.000Z',
  updatedAt: '2025-01-01T00:00:00.000Z',
};

describe('listPublicLobbies', () => {
  it('リポジトリの結果をそのまま返す', async () => {
    // Arrange
    const repo: ListPublicLobbiesRepository = {
      findPublic: vi.fn().mockResolvedValue([mockListItem]),
    };

    // Act
    const result = await listPublicLobbies(repo);

    // Assert
    expect(result).toEqual([mockListItem]);
  });

  it('未ログインでも呼べるよう userId を要求しない', async () => {
    // Arrange
    const findPublic = vi.fn().mockResolvedValue([]);
    const repo: ListPublicLobbiesRepository = { findPublic };

    // Act
    await listPublicLobbies(repo);

    // Assert
    expect(findPublic).toHaveBeenCalledWith();
  });
});
