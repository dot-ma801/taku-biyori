import { describe, expect, it, vi } from 'vitest';
import { getGameSession } from '@/game-session/application/get-game-session';
import type { GetGameSessionRepository } from '@/game-session/application/get-game-session';
import type { GameSessionDetail } from '@taku-biyori/shared';

const mockDetail: GameSessionDetail = {
  id: 'session-1',
  title: 'テスト卓',
  description: null,
  scenarioName: null,
  status: 'draft',
  isPublished: false,
  openUntil: null,
  scheduledAt: null,
  completedAt: null,
  maxMembers: null,
  createdBy: 'user-1',
  createdAt: '2025-01-01T00:00:00.000Z',
  updatedAt: '2025-01-01T00:00:00.000Z',
  members: [],
};

describe('getGameSession', () => {
  it('セッションが存在する場合は詳細を返す', async () => {
    // Arrange
    const repo: GetGameSessionRepository = {
      findDetailById: vi.fn().mockResolvedValue(mockDetail),
    };

    // Act
    const result = await getGameSession(repo, 'session-1');

    // Assert
    expect(result).toEqual(mockDetail);
  });

  it('セッションが存在しない場合は null を返す', async () => {
    // Arrange
    const repo: GetGameSessionRepository = {
      findDetailById: vi.fn().mockResolvedValue(null),
    };

    // Act
    const result = await getGameSession(repo, 'nonexistent');

    // Assert
    expect(result).toBeNull();
  });

  it('findDetailById に id を渡す', async () => {
    // Arrange
    const findDetailById = vi.fn().mockResolvedValue(mockDetail);
    const repo: GetGameSessionRepository = { findDetailById };

    // Act
    await getGameSession(repo, 'session-abc');

    // Assert
    expect(findDetailById).toHaveBeenCalledWith('session-abc');
  });
});
