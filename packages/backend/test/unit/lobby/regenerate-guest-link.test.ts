import { describe, expect, it, vi } from 'vitest';
import { regenerateGuestLink } from '@/lobby/application/regenerate-guest-link';
import type { RegenerateGuestLinkRepository } from '@/lobby/application/regenerate-guest-link';
import { LobbyStatus } from '@taku-biyori/shared';

const makeRepo = (
  overrides: Partial<RegenerateGuestLinkRepository> = {},
): RegenerateGuestLinkRepository => ({
  findHostUserId: vi.fn().mockResolvedValue('user-1'),
  findLobbyStatus: vi.fn().mockResolvedValue(LobbyStatus.open),
  replaceGuestLinkToken: vi
    .fn()
    .mockImplementation((_id: string, token: string) => Promise.resolve(token)),
  ...overrides,
});

describe('regenerateGuestLink', () => {
  it('ホストが再発行すると新しいトークンを返す', async () => {
    // Arrange
    const repo = makeRepo();

    // Act
    const result = await regenerateGuestLink(repo, 'lobby-1', 'user-1');

    // Assert
    expect(result.type).toBe('ok');
    expect(repo.replaceGuestLinkToken).toHaveBeenCalledWith(
      'lobby-1',
      expect.any(String),
    );
  });

  it('呼ぶたびに別のトークンになる（冪等ではない）', async () => {
    // Arrange
    const repo = makeRepo();

    // Act
    const first = await regenerateGuestLink(repo, 'lobby-1', 'user-1');
    const second = await regenerateGuestLink(repo, 'lobby-1', 'user-1');

    // Assert
    expect(first).toHaveProperty('token');
    expect(second).toHaveProperty('token');
    expect(first).not.toEqual(second);
  });

  it('ロビーが存在しなければ notFound', async () => {
    // Arrange
    const repo = makeRepo({
      findHostUserId: vi.fn().mockResolvedValue(null),
    });

    // Act
    const result = await regenerateGuestLink(repo, 'lobby-1', 'user-1');

    // Assert
    expect(result).toEqual({ type: 'notFound' });
  });

  it('ホスト以外は forbidden', async () => {
    // Arrange
    const repo = makeRepo({
      findHostUserId: vi.fn().mockResolvedValue('other-user'),
    });

    // Act
    const result = await regenerateGuestLink(repo, 'lobby-1', 'user-1');

    // Assert
    expect(result).toEqual({ type: 'forbidden' });
  });

  it('解散済みのロビーでは再発行できない', async () => {
    // Arrange
    const replaceGuestLinkToken = vi.fn();
    const repo = makeRepo({
      findLobbyStatus: vi.fn().mockResolvedValue(LobbyStatus.disbanded),
      replaceGuestLinkToken,
    });

    // Act
    const result = await regenerateGuestLink(repo, 'lobby-1', 'user-1');

    // Assert
    expect(result).toEqual({ type: 'invalidStatus' });
    expect(replaceGuestLinkToken).not.toHaveBeenCalled();
  });

  it.each([LobbyStatus.draft, LobbyStatus.open, LobbyStatus.closed])(
    'status が %s なら再発行できる',
    async (status) => {
      // Arrange
      const repo = makeRepo({
        findLobbyStatus: vi.fn().mockResolvedValue(status),
      });

      // Act
      const result = await regenerateGuestLink(repo, 'lobby-1', 'user-1');

      // Assert
      expect(result.type).toBe('ok');
    },
  );
});
