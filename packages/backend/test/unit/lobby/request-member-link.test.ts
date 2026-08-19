import { describe, expect, it, vi } from 'vitest';
import { requestMemberLink } from '@/lobby/application/request-member-link';
import type { RequestMemberLinkRepository } from '@/lobby/application/request-member-link';
import type { LobbyMemberLinkRequest } from '@taku-biyori/shared';

const LOBBY_ID = 'lobby-1';
const MEMBER_ID = 'member-guest-1';
const USER_ID = 'user-1';

const mockRequest: LobbyMemberLinkRequest = {
  id: 'request-1',
  memberId: MEMBER_ID,
  memberGuestName: 'ゲスト太郎',
  requestedUserId: USER_ID,
  requestedUserName: 'たろう',
  createdAt: '2025-01-01T00:00:00.000Z',
};

const makeRepo = (
  overrides: Partial<RequestMemberLinkRepository> = {},
): RequestMemberLinkRepository => ({
  findLobbyVisibility: vi
    .fn()
    .mockResolvedValue({ isPublished: true, hostUserId: 'host-1' }),
  isGuestMember: vi.fn().mockResolvedValue(true),
  findMemberByUserId: vi.fn().mockResolvedValue(null),
  insertLinkRequest: vi.fn().mockResolvedValue(mockRequest),
  ...overrides,
});

describe('requestMemberLink', () => {
  it('公開済み募集枠のゲスト行に対して申請できる', async () => {
    // Arrange
    const repo = makeRepo();

    // Act
    const result = await requestMemberLink(repo, LOBBY_ID, MEMBER_ID, USER_ID);

    // Assert
    expect(result).toEqual({ type: 'ok', request: mockRequest });
  });

  it('申請は対象メンバーと申請者のユーザーIDで登録される', async () => {
    // Arrange
    const insertLinkRequest = vi.fn().mockResolvedValue(mockRequest);
    const repo = makeRepo({ insertLinkRequest });

    // Act
    await requestMemberLink(repo, LOBBY_ID, MEMBER_ID, USER_ID);

    // Assert
    expect(insertLinkRequest).toHaveBeenCalledWith(MEMBER_ID, USER_ID);
  });

  it('存在しない募集枠IDは notFound を返す', async () => {
    // Arrange
    const repo = makeRepo({
      findLobbyVisibility: vi.fn().mockResolvedValue(null),
    });

    // Act
    const result = await requestMemberLink(
      repo,
      'nonexistent',
      MEMBER_ID,
      USER_ID,
    );

    // Assert
    expect(result).toEqual({ type: 'notFound' });
  });

  it('非公開（draft）の募集枠へは申請できない', async () => {
    // Arrange
    const repo = makeRepo({
      findLobbyVisibility: vi
        .fn()
        .mockResolvedValue({ isPublished: false, hostUserId: 'host-1' }),
    });

    // Act
    const result = await requestMemberLink(repo, LOBBY_ID, MEMBER_ID, USER_ID);

    // Assert
    expect(result).toEqual({ type: 'forbidden' });
  });

  it('ゲスト行でないメンバー（ログインユーザー）への申請は notGuestMember を返す', async () => {
    // Arrange
    const repo = makeRepo({
      isGuestMember: vi.fn().mockResolvedValue(false),
    });

    // Act
    const result = await requestMemberLink(repo, LOBBY_ID, MEMBER_ID, USER_ID);

    // Assert
    expect(result).toEqual({ type: 'notGuestMember' });
  });

  it('申請者が既にその募集枠のメンバーなら alreadyMember を返す', async () => {
    // Arrange
    const repo = makeRepo({
      findMemberByUserId: vi.fn().mockResolvedValue('member-existing'),
    });

    // Act
    const result = await requestMemberLink(repo, LOBBY_ID, MEMBER_ID, USER_ID);

    // Assert
    expect(result).toEqual({ type: 'alreadyMember' });
  });

  it('一意制約違反（重複申請）は alreadyRequested を返す', async () => {
    // Arrange
    const repo = makeRepo({
      insertLinkRequest: vi.fn().mockResolvedValue(null),
    });

    // Act
    const result = await requestMemberLink(repo, LOBBY_ID, MEMBER_ID, USER_ID);

    // Assert
    expect(result).toEqual({ type: 'alreadyRequested' });
  });
});
