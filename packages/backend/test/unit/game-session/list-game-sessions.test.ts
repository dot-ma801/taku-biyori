import { describe, expect, it, vi } from 'vitest';
import { listGameSessions } from '@/game-session/application/list-game-sessions';
import type { ListGameSessionsRepository } from '@/game-session/application/list-game-sessions';
import type { GameSessionListItem } from '@taku-biyori/shared';
import { GameSessionStatus } from '@taku-biyori/shared';

const mockListItem: GameSessionListItem = {
  id: 'session-1',
  lobbyId: 'lobby-1',
  title: 'テスト開催',
  scenarioName: null,
  status: GameSessionStatus.scheduled,
  scheduledAt: '2099-09-09',
  timeLabel: null,
  seats: [],
  hostUserId: 'user-1',
  createdAt: '2025-01-01T00:00:00.000Z',
  updatedAt: '2025-01-01T00:00:00.000Z',
};

describe('listGameSessions', () => {
  it('セッションがない場合は空配列を返す', async () => {
    // Arrange
    const repo: ListGameSessionsRepository = {
      findByUserId: vi.fn().mockResolvedValue([]),
    };

    // Act
    const result = await listGameSessions(repo, 'user-1');

    // Assert
    expect(result).toEqual([]);
  });

  it('ユーザーのセッション一覧を返す', async () => {
    // Arrange
    const repo: ListGameSessionsRepository = {
      findByUserId: vi.fn().mockResolvedValue([mockListItem]),
    };

    // Act
    const result = await listGameSessions(repo, 'user-1');

    // Assert
    expect(result).toHaveLength(1);
    expect(result[0]).toMatchObject({
      id: 'session-1',
      title: 'テスト開催',
      status: 'scheduled',
      lobbyId: 'lobby-1',
      seats: [],
    });
  });

  it('findByUserId に userId を渡す', async () => {
    // Arrange
    const findByUserId = vi.fn().mockResolvedValue([]);
    const repo: ListGameSessionsRepository = { findByUserId };

    // Act
    await listGameSessions(repo, 'user-42');

    // Assert
    expect(findByUserId).toHaveBeenCalledWith('user-42');
  });

  it('リポジトリが返す値をそのまま返す', async () => {
    // Arrange
    const items = [mockListItem, { ...mockListItem, id: 'session-2' }];
    const repo: ListGameSessionsRepository = {
      findByUserId: vi.fn().mockResolvedValue(items),
    };

    // Act
    const result = await listGameSessions(repo, 'user-1');

    // Assert
    expect(result).toBe(items);
  });
});
