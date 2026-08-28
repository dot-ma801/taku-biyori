import { describe, expect, it, vi } from 'vitest';
import { getGuestLinkPreview } from '@/game-session/application/get-guest-link-preview';
import type { GetGuestLinkPreviewRepository } from '@/game-session/application/get-guest-link-preview';
import type { GameSession } from '@taku-biyori/shared';
import { GameSessionStatus } from '@taku-biyori/shared';

const mockGameSession: GameSession = {
  id: 'session-1',
  title: 'テスト卓',
  description: null,
  scenarioName: null,
  location: null,
  status: GameSessionStatus.open,
  isPublished: true,
  scheduledAt: '2025-05-30',
  completedAt: null,
  maxMembers: null,
  createdBy: 'user-1',
  createdAt: '2025-01-01T00:00:00.000Z',
  updatedAt: '2025-01-01T00:00:00.000Z',
};

describe('getGuestLinkPreview', () => {
  it('有効なトークンの場合は ok とセッションを返す', async () => {
    // Arrange
    const repo: GetGuestLinkPreviewRepository = {
      findByGuestLinkToken: vi.fn().mockResolvedValue(mockGameSession),
    };

    // Act
    const result = await getGuestLinkPreview(repo, 'valid-token');

    // Assert
    expect(result).toEqual({ type: 'ok', gameSession: mockGameSession });
  });

  it('無効なトークンの場合は notFound を返す', async () => {
    // Arrange
    const repo: GetGuestLinkPreviewRepository = {
      findByGuestLinkToken: vi.fn().mockResolvedValue(null),
    };

    // Act
    const result = await getGuestLinkPreview(repo, 'invalid-token');

    // Assert
    expect(result).toEqual({ type: 'notFound' });
  });

  it('findByGuestLinkToken にトークンを渡す', async () => {
    // Arrange
    const findByGuestLinkToken = vi.fn().mockResolvedValue(mockGameSession);
    const repo: GetGuestLinkPreviewRepository = { findByGuestLinkToken };

    // Act
    await getGuestLinkPreview(repo, 'token-xyz');

    // Assert
    expect(findByGuestLinkToken).toHaveBeenCalledWith('token-xyz');
  });
});
