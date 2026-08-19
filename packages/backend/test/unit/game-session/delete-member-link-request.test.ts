import { describe, expect, it, vi } from 'vitest';
import { deleteMemberLinkRequest } from '@/game-session/application/delete-member-link-request';
import type { DeleteMemberLinkRequestRepository } from '@/game-session/application/delete-member-link-request';

const GAME_SESSION_ID = 'game-session-1';
const REQUEST_ID = 'request-1';
const HOST_USER_ID = 'host-1';
const REQUESTED_USER_ID = 'user-1';

const makeRepo = (
  overrides: Partial<DeleteMemberLinkRequestRepository> = {},
): DeleteMemberLinkRequestRepository => ({
  findHostUserId: vi.fn().mockResolvedValue(HOST_USER_ID),
  findLinkRequest: vi.fn().mockResolvedValue({
    gameSessionId: GAME_SESSION_ID,
    memberId: 'member-guest-1',
    requestedUserId: REQUESTED_USER_ID,
  }),
  deleteLinkRequest: vi.fn().mockResolvedValue(undefined),
  ...overrides,
});

describe('deleteMemberLinkRequest', () => {
  it('ホストは申請を却下できる', async () => {
    // Arrange
    const deleteLinkRequest = vi.fn().mockResolvedValue(undefined);
    const repo = makeRepo({ deleteLinkRequest });

    // Act
    const result = await deleteMemberLinkRequest(
      repo,
      GAME_SESSION_ID,
      REQUEST_ID,
      HOST_USER_ID,
    );

    // Assert
    expect(result).toEqual({ type: 'ok' });
    expect(deleteLinkRequest).toHaveBeenCalledWith(REQUEST_ID);
  });

  it('申請者本人は申請を取り下げられる', async () => {
    // Arrange
    const repo = makeRepo();

    // Act
    const result = await deleteMemberLinkRequest(
      repo,
      GAME_SESSION_ID,
      REQUEST_ID,
      REQUESTED_USER_ID,
    );

    // Assert
    expect(result).toEqual({ type: 'ok' });
  });

  it('ホストでも申請者でもないユーザーは forbidden を返す', async () => {
    // Arrange
    const deleteLinkRequest = vi.fn().mockResolvedValue(undefined);
    const repo = makeRepo({ deleteLinkRequest });

    // Act
    const result = await deleteMemberLinkRequest(
      repo,
      GAME_SESSION_ID,
      REQUEST_ID,
      'other-user',
    );

    // Assert
    expect(result).toEqual({ type: 'forbidden' });
    expect(deleteLinkRequest).not.toHaveBeenCalled();
  });

  it('存在しない申請IDは notFound を返す', async () => {
    // Arrange
    const repo = makeRepo({ findLinkRequest: vi.fn().mockResolvedValue(null) });

    // Act
    const result = await deleteMemberLinkRequest(
      repo,
      GAME_SESSION_ID,
      'nonexistent',
      HOST_USER_ID,
    );

    // Assert
    expect(result).toEqual({ type: 'notFound' });
  });

  it('別の卓に属する申請IDは notFound を返す', async () => {
    // Arrange
    const repo = makeRepo({
      findLinkRequest: vi.fn().mockResolvedValue({
        gameSessionId: 'other-game-session',
        memberId: 'member-guest-1',
        requestedUserId: REQUESTED_USER_ID,
      }),
    });

    // Act
    const result = await deleteMemberLinkRequest(
      repo,
      GAME_SESSION_ID,
      REQUEST_ID,
      HOST_USER_ID,
    );

    // Assert
    expect(result).toEqual({ type: 'notFound' });
  });
});
