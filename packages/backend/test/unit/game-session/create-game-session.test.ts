import { describe, expect, it, vi } from 'vitest';
import { createGameSession } from '../../../src/game-session/application/create-game-session';
import type { CreateGameSessionRepository } from '../../../src/game-session/application/create-game-session';
import type { GameSession } from '@taku-biyori/shared';

const mockGameSession: GameSession = {
  id: 'session-1',
  hostUserId: 'user-1',
  title: 'テスト卓',
  scenarioName: null,
  description: null,
  maxMembers: null,
  status: 'draft',
  isPublished: false,
  openUntil: null,
  scheduledAt: null,
  completedAt: null,
  createdBy: 'user-1',
  createdAt: '2025-01-01T00:00:00.000Z',
  updatedAt: '2025-01-01T00:00:00.000Z',
};

describe('createGameSession', () => {
  it('ユースケースが GameSession を返す', async () => {
    // Arrange
    const repo: CreateGameSessionRepository = {
      createWithHost: vi.fn().mockResolvedValue(mockGameSession),
    };

    // Act
    const result = await createGameSession(repo, 'user-1', { title: 'テスト卓' });

    // Assert
    expect(result).toMatchObject({
      id: 'session-1',
      title: 'テスト卓',
      status: 'draft',
      isPublished: false,
      createdBy: 'user-1',
    });
  });

  it('createWithHost に hostUserId と title を渡す', async () => {
    // Arrange
    const createWithHost = vi.fn().mockResolvedValue(mockGameSession);
    const repo: CreateGameSessionRepository = { createWithHost };

    // Act
    await createGameSession(repo, 'user-99', { title: 'マイ卓' });

    // Assert
    expect(createWithHost).toHaveBeenCalledWith(
      expect.objectContaining({ hostUserId: 'user-99', title: 'マイ卓' }),
    );
  });

  it('guestLinkToken が 16 バイト base64url 形式で渡される', async () => {
    // Arrange
    const createWithHost = vi.fn().mockResolvedValue(mockGameSession);
    const repo: CreateGameSessionRepository = { createWithHost };

    // Act
    await createGameSession(repo, 'user-1', { title: '卓' });

    // Assert
    const { guestLinkToken } = createWithHost.mock.calls[0]![0];
    // base64url: A-Z a-z 0-9 - _  (no padding)
    expect(guestLinkToken).toMatch(/^[A-Za-z0-9_-]+$/);
    expect(guestLinkToken.length).toBeGreaterThan(10);
  });

  it('オプションフィールドを createWithHost に渡す', async () => {
    // Arrange
    const createWithHost = vi.fn().mockResolvedValue(mockGameSession);
    const repo: CreateGameSessionRepository = { createWithHost };

    // Act
    await createGameSession(repo, 'user-1', {
      title: '詳細卓',
      description: '説明文',
      scenarioName: 'シナリオ名',
      maxMembers: 5,
      openUntil: '2025-09-01',
    });

    // Assert
    expect(createWithHost).toHaveBeenCalledWith(
      expect.objectContaining({
        description: '説明文',
        scenarioName: 'シナリオ名',
        maxMembers: 5,
        openUntil: '2025-09-01',
      }),
    );
  });
});
