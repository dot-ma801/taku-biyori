import { describe, expect, it, vi } from 'vitest';
import { getGuestLink } from '@/game-session/application/get-guest-link';
import type { GetGuestLinkRepository } from '@/game-session/application/get-guest-link';

const mockRepo = (
  info: { hostUserId: string; token: string } | null,
): GetGuestLinkRepository => ({
  findGuestLinkInfo: vi.fn().mockResolvedValue(info),
});

describe('getGuestLink', () => {
  it('ホストがリクエストすると ok とトークンを返す', async () => {
    // Arrange
    const repo = mockRepo({ hostUserId: 'user-1', token: 'token-abc' });

    // Act
    const result = await getGuestLink(repo, 'session-1', 'user-1');

    // Assert
    expect(result).toEqual({ type: 'ok', token: 'token-abc' });
  });

  it('セッションが存在しない場合は notFound を返す', async () => {
    // Arrange
    const repo = mockRepo(null);

    // Act
    const result = await getGuestLink(repo, 'nonexistent', 'user-1');

    // Assert
    expect(result).toEqual({ type: 'notFound' });
  });

  it('ホスト以外がリクエストすると forbidden を返す', async () => {
    // Arrange
    const repo = mockRepo({ hostUserId: 'user-1', token: 'token-abc' });

    // Act
    const result = await getGuestLink(repo, 'session-1', 'other-user');

    // Assert
    expect(result).toEqual({ type: 'forbidden' });
  });

  it('findGuestLinkInfo に id を渡す', async () => {
    // Arrange
    const findGuestLinkInfo = vi
      .fn()
      .mockResolvedValue({ hostUserId: 'user-1', token: 'token-abc' });
    const repo: GetGuestLinkRepository = { findGuestLinkInfo };

    // Act
    await getGuestLink(repo, 'session-xyz', 'user-1');

    // Assert
    expect(findGuestLinkInfo).toHaveBeenCalledWith('session-xyz');
  });
});
