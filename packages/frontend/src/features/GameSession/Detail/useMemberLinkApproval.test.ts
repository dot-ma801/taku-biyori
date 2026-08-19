import { describe, it, expect, vi, beforeEach } from 'vitest';
import { useMemberLinkApproval } from '@/features/GameSession/Detail/useMemberLinkApproval';
import type { GameSessionMember, GameSessionMemberLinkRequest } from '@taku-biyori/shared';

vi.mock('@/api/game-session', () => ({
  listGameSessionMemberLinkRequests: vi.fn(),
  approveGameSessionMemberLink: vi.fn(),
  deleteGameSessionMemberLinkRequest: vi.fn(),
}));

const mockToastSuccess = vi.fn();
const mockToastError = vi.fn();
vi.mock('@/composables/useToast', () => ({
  useToast: () => ({ success: mockToastSuccess, error: mockToastError }),
}));

import {
  listGameSessionMemberLinkRequests,
  approveGameSessionMemberLink,
  deleteGameSessionMemberLinkRequest,
} from '@/api/game-session';

const GAME_SESSION_ID = 'game-session-1';

const mockRequest: GameSessionMemberLinkRequest = {
  id: 'request-1',
  memberId: 'member-guest-1',
  memberGuestName: 'ゲスト太郎',
  requestedUserId: 'user-1',
  requestedUserName: 'たろう',
  createdAt: '2025-01-01T00:00:00.000Z',
};

const linkedMember: GameSessionMember = {
  id: 'member-guest-1',
  userId: 'user-1',
  userName: 'たろう',
  guestName: 'ゲスト太郎',
  characterName: null,
  joinedAt: '2025-01-01T00:00:00.000Z',
};

beforeEach(() => {
  vi.clearAllMocks();
});

describe('load', () => {
  it('ホストなら申請一覧を取得する', async () => {
    // Arrange
    vi.mocked(listGameSessionMemberLinkRequests).mockResolvedValue([mockRequest]);
    const { load, requests } = useMemberLinkApproval(
      GAME_SESSION_ID,
      () => true,
      vi.fn(),
    );

    // Act
    await load();

    // Assert
    expect(requests.value).toEqual([mockRequest]);
  });

  it('ホストでなければ取得しない（403 になる呼び出しを投げない）', async () => {
    // Arrange
    const { load, requests } = useMemberLinkApproval(
      GAME_SESSION_ID,
      () => false,
      vi.fn(),
    );

    // Act
    await load();

    // Assert
    expect(listGameSessionMemberLinkRequests).not.toHaveBeenCalled();
    expect(requests.value).toEqual([]);
  });

  it('取得に失敗しても一覧は空のままにする', async () => {
    // Arrange
    vi.mocked(listGameSessionMemberLinkRequests).mockRejectedValue(new Error('x'));
    const { load, requests } = useMemberLinkApproval(
      GAME_SESSION_ID,
      () => true,
      vi.fn(),
    );

    // Act
    await load();

    // Assert
    expect(requests.value).toEqual([]);
  });
});

describe('hasRequests', () => {
  it('申請が1件以上あれば true', async () => {
    // Arrange
    vi.mocked(listGameSessionMemberLinkRequests).mockResolvedValue([mockRequest]);
    const { load, hasRequests } = useMemberLinkApproval(
      GAME_SESSION_ID,
      () => true,
      vi.fn(),
    );

    // Act
    await load();

    // Assert
    expect(hasRequests.value).toBe(true);
  });
});

describe('approve', () => {
  it('承認すると紐づけ後のメンバーを所有者へ渡し、一覧から取り除く', async () => {
    // Arrange
    vi.mocked(listGameSessionMemberLinkRequests).mockResolvedValue([mockRequest]);
    vi.mocked(approveGameSessionMemberLink).mockResolvedValue(linkedMember);
    const onApproved = vi.fn();
    const { load, approve, requests } = useMemberLinkApproval(
      GAME_SESSION_ID,
      () => true,
      onApproved,
    );
    await load();

    // Act
    await approve(mockRequest.id);

    // Assert
    expect(approveGameSessionMemberLink).toHaveBeenCalledWith(
      GAME_SESSION_ID,
      mockRequest.id,
    );
    expect(onApproved).toHaveBeenCalledWith(linkedMember);
    expect(requests.value).toEqual([]);
    expect(mockToastSuccess).toHaveBeenCalled();
  });

  it('承認に失敗したら一覧を保持したままエラーを通知する', async () => {
    // Arrange
    vi.mocked(listGameSessionMemberLinkRequests).mockResolvedValue([mockRequest]);
    vi.mocked(approveGameSessionMemberLink).mockRejectedValue(new Error('conflict'));
    const onApproved = vi.fn();
    const { load, approve, requests } = useMemberLinkApproval(
      GAME_SESSION_ID,
      () => true,
      onApproved,
    );
    await load();

    // Act
    await approve(mockRequest.id);

    // Assert
    expect(mockToastError).toHaveBeenCalled();
    expect(onApproved).not.toHaveBeenCalled();
    expect(requests.value).toEqual([mockRequest]);
  });
});

describe('reject', () => {
  it('却下すると一覧から取り除く', async () => {
    // Arrange
    vi.mocked(listGameSessionMemberLinkRequests).mockResolvedValue([mockRequest]);
    vi.mocked(deleteGameSessionMemberLinkRequest).mockResolvedValue(undefined);
    const { load, reject, requests } = useMemberLinkApproval(
      GAME_SESSION_ID,
      () => true,
      vi.fn(),
    );
    await load();

    // Act
    await reject(mockRequest.id);

    // Assert
    expect(deleteGameSessionMemberLinkRequest).toHaveBeenCalledWith(
      GAME_SESSION_ID,
      mockRequest.id,
    );
    expect(requests.value).toEqual([]);
  });
});
