import { describe, expect, it, vi } from 'vitest';
import { getGuestLink } from '@/game-session/application/get-guest-link';
import type { GetGuestLinkRepository } from '@/game-session/application/get-guest-link';

const mockRepo = (
  hostUserId: string | null,
  token: string | null,
): GetGuestLinkRepository => ({
  findHostUserId: vi.fn().mockResolvedValue(hostUserId),
  findGuestLinkToken: vi.fn().mockResolvedValue(token),
});

describe('getGuestLink', () => {
  it('ホストがリクエストすると ok とトークンを返す', async () => {
    // Arrange
    const repo = mockRepo('user-1', 'token-abc');

    // Act
    const result = await getGuestLink(repo, 'session-1', 'user-1');

    // Assert
    expect(result).toEqual({ type: 'ok', token: 'token-abc' });
  });

  it('セッションが存在しない場合は notFound を返す', async () => {
    // Arrange
    const repo = mockRepo(null, null);

    // Act
    const result = await getGuestLink(repo, 'nonexistent', 'user-1');

    // Assert
    expect(result).toEqual({ type: 'notFound' });
  });

  it('ホスト以外がリクエストすると forbidden を返す', async () => {
    // Arrange
    const repo = mockRepo('user-1', 'token-abc');

    // Act
    const result = await getGuestLink(repo, 'session-1', 'other-user');

    // Assert
    expect(result).toEqual({ type: 'forbidden' });
  });

  it('findHostUserId に id を渡す', async () => {
    // Arrange
    const findHostUserId = vi.fn().mockResolvedValue('user-1');
    const repo: GetGuestLinkRepository = {
      findHostUserId,
      findGuestLinkToken: vi.fn().mockResolvedValue('token-abc'),
    };

    // Act
    await getGuestLink(repo, 'session-xyz', 'user-1');

    // Assert
    expect(findHostUserId).toHaveBeenCalledWith('session-xyz');
  });
});
