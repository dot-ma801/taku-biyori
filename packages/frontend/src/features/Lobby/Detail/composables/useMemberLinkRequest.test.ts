import { describe, it, expect, vi, beforeEach } from 'vitest';
import { useMemberLinkRequest } from '@/features/Lobby/Detail/composables/useMemberLinkRequest';
import type { LobbyMember } from '@taku-biyori/shared';

vi.mock('@/api/lobby', () => ({
  requestLobbyMemberLink: vi.fn(),
}));

type SessionValue = { data: { user?: { id?: string | null } } | null };
let sessionSubscribers: Array<(v: SessionValue) => void> = [];
let currentSessionValue: SessionValue = { data: null };

vi.mock('@/lib/auth', () => ({
  useSession: {
    get: vi.fn(() => currentSessionValue),
    subscribe: vi.fn((cb: (v: SessionValue) => void) => {
      sessionSubscribers.push(cb);
      return () => {
        sessionSubscribers = sessionSubscribers.filter((s) => s !== cb);
      };
    }),
  },
}));

const mockToastSuccess = vi.fn();
const mockToastError = vi.fn();
vi.mock('@/composables/useToast', () => ({
  useToast: () => ({ success: mockToastSuccess, error: mockToastError }),
}));

import { requestLobbyMemberLink } from '@/api/lobby';

const LOBBY_ID = 'lobby-1';
const USER_ID = 'user-1';
const HOST_ID = 'host-1';

const guestMember: LobbyMember = {
  id: 'member-guest-1',
  userId: null,
  userName: null,
  guestName: 'ゲスト太郎',
  joinedAt: '2025-01-01T00:00:00.000Z',
};

const loggedInMember: LobbyMember = {
  id: 'member-user-1',
  userId: USER_ID,
  userName: 'たろう',
  guestName: null,
  joinedAt: '2025-01-01T00:00:00.000Z',
};

function setSession(value: SessionValue) {
  currentSessionValue = value;
  sessionSubscribers.forEach((cb) => cb(value));
}

beforeEach(() => {
  vi.clearAllMocks();
  currentSessionValue = { data: { user: { id: USER_ID } } };
  sessionSubscribers = [];
});

describe('canRequestLink', () => {
  it('ログイン済み・未参加でゲスト行があるとき true', () => {
    // Act
    const { canRequestLink } = useMemberLinkRequest(
      LOBBY_ID,
      () => [guestMember],
      () => HOST_ID,
      vi.fn(),
    );

    // Assert
    expect(canRequestLink.value).toBe(true);
  });

  it('未ログインのとき false（紐づけ先のアカウントがないため）', () => {
    // Arrange
    setSession({ data: null });

    // Act
    const { canRequestLink } = useMemberLinkRequest(
      LOBBY_ID,
      () => [guestMember],
      () => HOST_ID,
      vi.fn(),
    );

    // Assert
    expect(canRequestLink.value).toBe(false);
  });

  it('既にメンバーとして参加済みのとき false', () => {
    // Act
    const { canRequestLink } = useMemberLinkRequest(
      LOBBY_ID,
      () => [guestMember, loggedInMember],
      () => HOST_ID,
      vi.fn(),
    );

    // Assert
    expect(canRequestLink.value).toBe(false);
  });

  it('ホスト本人のとき false', () => {
    // Act
    const { canRequestLink } = useMemberLinkRequest(
      LOBBY_ID,
      () => [guestMember],
      () => USER_ID,
      vi.fn(),
    );

    // Assert
    expect(canRequestLink.value).toBe(false);
  });

  it('ゲスト行が1件もないとき false', () => {
    // Act
    const { canRequestLink } = useMemberLinkRequest(
      LOBBY_ID,
      () => [loggedInMember],
      () => HOST_ID,
      vi.fn(),
    );

    // Assert
    expect(canRequestLink.value).toBe(false);
  });
});

describe('guestMembers', () => {
  it('ゲスト行（userId が null）だけを返す', () => {
    // Act
    const { guestMembers } = useMemberLinkRequest(
      LOBBY_ID,
      () => [guestMember, loggedInMember],
      () => HOST_ID,
      vi.fn(),
    );

    // Assert
    expect(guestMembers.value).toEqual([guestMember]);
  });
});

describe('submit', () => {
  it('選択したゲスト行で申請し、成功を通知して所有者へ通知する', async () => {
    // Arrange
    vi.mocked(requestLobbyMemberLink).mockResolvedValue({
      id: 'request-1',
      memberId: guestMember.id,
      memberGuestName: 'ゲスト太郎',
      requestedUserId: USER_ID,
      requestedUserName: 'たろう',
      createdAt: '2025-01-01T00:00:00.000Z',
    });
    const onRequested = vi.fn();
    const { selectedMemberId, submit } = useMemberLinkRequest(
      LOBBY_ID,
      () => [guestMember],
      () => HOST_ID,
      onRequested,
    );
    selectedMemberId.value = guestMember.id;

    // Act
    await submit();

    // Assert
    expect(requestLobbyMemberLink).toHaveBeenCalledWith(
      LOBBY_ID,
      guestMember.id,
    );
    expect(mockToastSuccess).toHaveBeenCalled();
    expect(onRequested).toHaveBeenCalled();
  });

  it('未選択のときは API を呼ばずにエラーを通知する', async () => {
    // Arrange
    const { submit } = useMemberLinkRequest(
      LOBBY_ID,
      () => [guestMember],
      () => HOST_ID,
      vi.fn(),
    );

    // Act
    await submit();

    // Assert
    expect(requestLobbyMemberLink).not.toHaveBeenCalled();
    expect(mockToastError).toHaveBeenCalled();
  });

  it('API が失敗したらエラーを通知し、所有者へは通知しない', async () => {
    // Arrange
    vi.mocked(requestLobbyMemberLink).mockRejectedValue(new Error('failed'));
    const onRequested = vi.fn();
    const { selectedMemberId, submit } = useMemberLinkRequest(
      LOBBY_ID,
      () => [guestMember],
      () => HOST_ID,
      onRequested,
    );
    selectedMemberId.value = guestMember.id;

    // Act
    await submit();

    // Assert
    expect(mockToastError).toHaveBeenCalled();
    expect(onRequested).not.toHaveBeenCalled();
  });

  it('送信中の二重実行は無視する', async () => {
    // Arrange
    let resolve!: (v: unknown) => void;
    vi.mocked(requestLobbyMemberLink).mockReturnValue(
      new Promise((r) => {
        resolve = r as (v: unknown) => void;
      }) as ReturnType<typeof requestLobbyMemberLink>,
    );
    const { selectedMemberId, submit } = useMemberLinkRequest(
      LOBBY_ID,
      () => [guestMember],
      () => HOST_ID,
      vi.fn(),
    );
    selectedMemberId.value = guestMember.id;

    // Act
    const first = submit();
    await submit();
    resolve({});
    await first;

    // Assert
    expect(requestLobbyMemberLink).toHaveBeenCalledTimes(1);
  });
});
