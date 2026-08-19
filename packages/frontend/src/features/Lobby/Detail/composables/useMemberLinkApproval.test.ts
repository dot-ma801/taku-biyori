import { describe, it, expect, vi, beforeEach } from 'vitest';
import { useMemberLinkApproval } from '@/features/Lobby/Detail/composables/useMemberLinkApproval';
import type { LobbyMember, LobbyMemberLinkRequest } from '@taku-biyori/shared';

vi.mock('@/api/lobby', () => ({
  listLobbyMemberLinkRequests: vi.fn(),
  approveLobbyMemberLink: vi.fn(),
  deleteLobbyMemberLinkRequest: vi.fn(),
}));

const mockToastSuccess = vi.fn();
const mockToastError = vi.fn();
vi.mock('@/composables/useToast', () => ({
  useToast: () => ({ success: mockToastSuccess, error: mockToastError }),
}));

import {
  listLobbyMemberLinkRequests,
  approveLobbyMemberLink,
  deleteLobbyMemberLinkRequest,
} from '@/api/lobby';

const LOBBY_ID = 'lobby-1';

const mockRequest: LobbyMemberLinkRequest = {
  id: 'request-1',
  memberId: 'member-guest-1',
  memberGuestName: 'ゲスト太郎',
  requestedUserId: 'user-1',
  requestedUserName: 'たろう',
  createdAt: '2025-01-01T00:00:00.000Z',
};

const linkedMember: LobbyMember = {
  id: 'member-guest-1',
  userId: 'user-1',
  userName: 'たろう',
  guestName: 'ゲスト太郎',
  joinedAt: '2025-01-01T00:00:00.000Z',
};

beforeEach(() => {
  vi.clearAllMocks();
});

describe('load', () => {
  it('ホストなら申請一覧を取得する', async () => {
    // Arrange
    vi.mocked(listLobbyMemberLinkRequests).mockResolvedValue([mockRequest]);
    const { load, requests } = useMemberLinkApproval(
      LOBBY_ID,
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
      LOBBY_ID,
      () => false,
      vi.fn(),
    );

    // Act
    await load();

    // Assert
    expect(listLobbyMemberLinkRequests).not.toHaveBeenCalled();
    expect(requests.value).toEqual([]);
  });

  it('取得に失敗しても一覧は空のままにする', async () => {
    // Arrange
    vi.mocked(listLobbyMemberLinkRequests).mockRejectedValue(new Error('x'));
    const { load, requests } = useMemberLinkApproval(
      LOBBY_ID,
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
    vi.mocked(listLobbyMemberLinkRequests).mockResolvedValue([mockRequest]);
    const { load, hasRequests } = useMemberLinkApproval(
      LOBBY_ID,
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
    vi.mocked(listLobbyMemberLinkRequests).mockResolvedValue([mockRequest]);
    vi.mocked(approveLobbyMemberLink).mockResolvedValue(linkedMember);
    const onApproved = vi.fn();
    const { load, approve, requests } = useMemberLinkApproval(
      LOBBY_ID,
      () => true,
      onApproved,
    );
    await load();

    // Act
    await approve(mockRequest.id);

    // Assert
    expect(approveLobbyMemberLink).toHaveBeenCalledWith(
      LOBBY_ID,
      mockRequest.id,
    );
    expect(onApproved).toHaveBeenCalledWith(linkedMember);
    expect(requests.value).toEqual([]);
    expect(mockToastSuccess).toHaveBeenCalled();
  });

  it('承認に失敗したら一覧を保持したままエラーを通知する', async () => {
    // Arrange
    vi.mocked(listLobbyMemberLinkRequests).mockResolvedValue([mockRequest]);
    vi.mocked(approveLobbyMemberLink).mockRejectedValue(new Error('conflict'));
    const onApproved = vi.fn();
    const { load, approve, requests } = useMemberLinkApproval(
      LOBBY_ID,
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
    vi.mocked(listLobbyMemberLinkRequests).mockResolvedValue([mockRequest]);
    vi.mocked(deleteLobbyMemberLinkRequest).mockResolvedValue(undefined);
    const { load, reject, requests } = useMemberLinkApproval(
      LOBBY_ID,
      () => true,
      vi.fn(),
    );
    await load();

    // Act
    await reject(mockRequest.id);

    // Assert
    expect(deleteLobbyMemberLinkRequest).toHaveBeenCalledWith(
      LOBBY_ID,
      mockRequest.id,
    );
    expect(requests.value).toEqual([]);
  });
});
