import { describe, expect, it, vi } from 'vitest';
import { listMemberLinkRequests } from '@/game-session/application/list-member-link-requests';
import type { ListMemberLinkRequestsRepository } from '@/game-session/application/list-member-link-requests';
import type { GameSessionMemberLinkRequest } from '@taku-biyori/shared';

const GAME_SESSION_ID = 'game-session-1';
const HOST_USER_ID = 'host-1';

const mockRequests: GameSessionMemberLinkRequest[] = [
  {
    id: 'request-1',
    memberId: 'member-guest-1',
    memberGuestName: 'ゲスト太郎',
    requestedUserId: 'user-1',
    requestedUserName: 'たろう',
    createdAt: '2025-01-01T00:00:00.000Z',
  },
];

const makeRepo = (
  overrides: Partial<ListMemberLinkRequestsRepository> = {},
): ListMemberLinkRequestsRepository => ({
  findHostUserId: vi.fn().mockResolvedValue(HOST_USER_ID),
  findLinkRequestsByGameSessionId: vi.fn().mockResolvedValue(mockRequests),
  ...overrides,
});

describe('listMemberLinkRequests', () => {
  it('ホストは申請一覧を取得できる', async () => {
    // Arrange
    const repo = makeRepo();

    // Act
    const result = await listMemberLinkRequests(
      repo,
      GAME_SESSION_ID,
      HOST_USER_ID,
    );

    // Assert
    expect(result).toEqual({ type: 'ok', requests: mockRequests });
  });

  it('存在しない卓IDは notFound を返す', async () => {
    // Arrange
    const repo = makeRepo({ findHostUserId: vi.fn().mockResolvedValue(null) });

    // Act
    const result = await listMemberLinkRequests(
      repo,
      'nonexistent',
      HOST_USER_ID,
    );

    // Assert
    expect(result).toEqual({ type: 'notFound' });
  });

  it('ホスト以外は forbidden を返す', async () => {
    // Arrange
    const repo = makeRepo();

    // Act
    const result = await listMemberLinkRequests(
      repo,
      GAME_SESSION_ID,
      'other-user',
    );

    // Assert
    expect(result).toEqual({ type: 'forbidden' });
  });

  it('ホスト以外には申請一覧を引きに行かない', async () => {
    // Arrange
    const findLinkRequestsByGameSessionId = vi
      .fn()
      .mockResolvedValue(mockRequests);
    const repo = makeRepo({ findLinkRequestsByGameSessionId });

    // Act
    await listMemberLinkRequests(repo, GAME_SESSION_ID, 'other-user');

    // Assert
    expect(findLinkRequestsByGameSessionId).not.toHaveBeenCalled();
  });
});
