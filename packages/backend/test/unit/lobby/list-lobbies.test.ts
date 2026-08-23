import { describe, expect, it, vi } from 'vitest';
import { listLobbies } from '@/lobby/application/list-lobbies';
import type { ListLobbiesRepository } from '@/lobby/application/list-lobbies';
import type { LobbyListItem } from '@taku-biyori/shared';
import { LobbyStatus } from '@taku-biyori/shared';

const mockListItem: LobbyListItem = {
  id: 'lobby-1',
  title: 'テスト募集',
  status: LobbyStatus.draft,
  isPublished: false,
  memberCount: 1,
  role: 'host',
  createdAt: '2025-01-01T00:00:00.000Z',
  updatedAt: '2025-01-01T00:00:00.000Z',
};

describe('listLobbies', () => {
  it('リポジトリの結果をそのまま返す', async () => {
    // Arrange
    const repo: ListLobbiesRepository = {
      findByUserId: vi.fn().mockResolvedValue([mockListItem]),
    };

    // Act
    const result = await listLobbies(repo, 'user-1');

    // Assert
    expect(result).toEqual([mockListItem]);
  });

  it('userId をリポジトリに渡す', async () => {
    // Arrange
    const findByUserId = vi.fn().mockResolvedValue([]);
    const repo: ListLobbiesRepository = { findByUserId };

    // Act
    await listLobbies(repo, 'user-99');

    // Assert
    expect(findByUserId).toHaveBeenCalledWith('user-99');
  });
});
