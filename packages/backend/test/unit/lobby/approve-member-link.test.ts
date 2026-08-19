import { describe, expect, it, vi } from 'vitest';
import { approveMemberLink } from '@/lobby/application/approve-member-link';
import type { ApproveMemberLinkRepository } from '@/lobby/application/approve-member-link';
import type { LobbyMember } from '@taku-biyori/shared';

const LOBBY_ID = 'lobby-1';
const REQUEST_ID = 'request-1';
const MEMBER_ID = 'member-guest-1';
const HOST_USER_ID = 'host-1';
const REQUESTED_USER_ID = 'user-1';

const linkedMember: LobbyMember = {
  id: MEMBER_ID,
  userId: REQUESTED_USER_ID,
  userName: 'たろう',
  guestName: 'ゲスト太郎',
  joinedAt: '2025-01-01T00:00:00.000Z',
};

const makeRepo = (
  overrides: Partial<ApproveMemberLinkRepository> = {},
): ApproveMemberLinkRepository => ({
  findHostUserId: vi.fn().mockResolvedValue(HOST_USER_ID),
  findLinkRequest: vi.fn().mockResolvedValue({
    lobbyId: LOBBY_ID,
    memberId: MEMBER_ID,
    requestedUserId: REQUESTED_USER_ID,
  }),
  applyMemberLink: vi.fn().mockResolvedValue(linkedMember),
  ...overrides,
});

describe('approveMemberLink', () => {
  it('ホストが承認するとゲスト行にユーザーIDが入る', async () => {
    // Arrange
    const applyMemberLink = vi.fn().mockResolvedValue(linkedMember);
    const repo = makeRepo({ applyMemberLink });

    // Act
    const result = await approveMemberLink(
      repo,
      LOBBY_ID,
      REQUEST_ID,
      HOST_USER_ID,
    );

    // Assert
    expect(result).toEqual({ type: 'ok', member: linkedMember });
    expect(applyMemberLink).toHaveBeenCalledWith(MEMBER_ID, REQUESTED_USER_ID);
  });

  it('存在しない申請IDは notFound を返す', async () => {
    // Arrange
    const repo = makeRepo({ findLinkRequest: vi.fn().mockResolvedValue(null) });

    // Act
    const result = await approveMemberLink(
      repo,
      LOBBY_ID,
      'nonexistent',
      HOST_USER_ID,
    );

    // Assert
    expect(result).toEqual({ type: 'notFound' });
  });

  it('別の募集枠に属する申請IDは notFound を返す', async () => {
    // Arrange
    const repo = makeRepo({
      findLinkRequest: vi.fn().mockResolvedValue({
        lobbyId: 'other-lobby',
        memberId: MEMBER_ID,
        requestedUserId: REQUESTED_USER_ID,
      }),
    });

    // Act
    const result = await approveMemberLink(
      repo,
      LOBBY_ID,
      REQUEST_ID,
      HOST_USER_ID,
    );

    // Assert
    expect(result).toEqual({ type: 'notFound' });
  });

  it('ホスト以外は forbidden を返す', async () => {
    // Arrange
    const repo = makeRepo();

    // Act
    const result = await approveMemberLink(
      repo,
      LOBBY_ID,
      REQUEST_ID,
      'other-user',
    );

    // Assert
    expect(result).toEqual({ type: 'forbidden' });
  });

  it('ホスト以外の場合は紐づけを実行しない', async () => {
    // Arrange
    const applyMemberLink = vi.fn().mockResolvedValue(linkedMember);
    const repo = makeRepo({ applyMemberLink });

    // Act
    await approveMemberLink(repo, LOBBY_ID, REQUEST_ID, 'other-user');

    // Assert
    expect(applyMemberLink).not.toHaveBeenCalled();
  });

  it('既に同じユーザーが参加済みで一意制約に衝突する場合は conflict を返す', async () => {
    // Arrange
    const repo = makeRepo({ applyMemberLink: vi.fn().mockResolvedValue(null) });

    // Act
    const result = await approveMemberLink(
      repo,
      LOBBY_ID,
      REQUEST_ID,
      HOST_USER_ID,
    );

    // Assert
    expect(result).toEqual({ type: 'conflict' });
  });
});
