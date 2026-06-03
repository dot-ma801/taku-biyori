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

const publishedDetail: GameSessionDetail = {
  ...mockDetail,
  isPublished: true,
};

describe('getGameSession', () => {
  it('公開済みセッションは未認証でも ok を返す', async () => {
    // Arrange
    const repo: GetGameSessionRepository = {
      findDetailById: vi.fn().mockResolvedValue(publishedDetail),
    };

    // Act
    const result = await getGameSession(repo, 'session-1', null);

    // Assert
    expect(result).toEqual({ type: 'ok', gameSession: publishedDetail });
  });

  it('非公開セッションをホストが参照すると ok を返す', async () => {
    // Arrange
    const repo: GetGameSessionRepository = {
      findDetailById: vi.fn().mockResolvedValue(mockDetail),
    };

    // Act
    const result = await getGameSession(repo, 'session-1', 'user-1');

    // Assert
    expect(result).toEqual({ type: 'ok', gameSession: mockDetail });
  });

  it('非公開セッションを未認証ユーザーが参照すると forbidden を返す', async () => {
    // Arrange
    const repo: GetGameSessionRepository = {
      findDetailById: vi.fn().mockResolvedValue(mockDetail),
    };

    // Act
    const result = await getGameSession(repo, 'session-1', null);

    // Assert
    expect(result).toEqual({ type: 'forbidden' });
  });

  it('非公開セッションにホスト以外がアクセスすると forbidden を返す', async () => {
    // Arrange
    const repo: GetGameSessionRepository = {
      findDetailById: vi.fn().mockResolvedValue(mockDetail),
    };

    // Act
    const result = await getGameSession(repo, 'session-1', 'other-user');

    // Assert
    expect(result).toEqual({ type: 'forbidden' });
  });

  it('セッションが存在しない場合は notFound を返す', async () => {
    // Arrange
    const repo: GetGameSessionRepository = {
      findDetailById: vi.fn().mockResolvedValue(null),
    };

    // Act
    const result = await getGameSession(repo, 'nonexistent', 'user-1');

    // Assert
    expect(result).toEqual({ type: 'notFound' });
  });

  it('findDetailById に id を渡す', async () => {
    // Arrange
    const findDetailById = vi.fn().mockResolvedValue(publishedDetail);
    const repo: GetGameSessionRepository = { findDetailById };

    // Act
    await getGameSession(repo, 'session-abc', null);

    // Assert
    expect(findDetailById).toHaveBeenCalledWith('session-abc');
  });
});
