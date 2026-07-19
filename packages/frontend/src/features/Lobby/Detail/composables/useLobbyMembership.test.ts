import { describe, it, expect, vi, beforeEach } from 'vitest';
import { ref } from 'vue';
import type { MaybeRefOrGetter } from 'vue';
import { useLobbyMembership } from '@/features/Lobby/Detail/composables/useLobbyMembership';
import { LobbyStatus } from '@taku-biyori/shared';
import type { LobbyDetail } from '@taku-biyori/shared';

vi.mock('@/api/lobby', () => ({
  joinLobby: vi.fn(),
  leaveLobby: vi.fn(),
}));

// useSession（nanostores の Atom）のモック。
// get() は現在値を返し、subscribe() はコールバックを保持して後から発火できるようにする。
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

vi.mock('@/composables/useToast', () => ({
  useToast: vi.fn(() => ({ error: vi.fn() })),
}));

import { joinLobby, leaveLobby } from '@/api/lobby';
import { useToast } from '@/composables/useToast';

function setSession(value: SessionValue) {
  currentSessionValue = value;
  sessionSubscribers.forEach((cb) => cb(value));
}

const LOBBY_ID = 'lobby-1';
const USER_ID = 'user-1';
const HOST_ID = 'host-1';
const MEMBER_ID = 'member-1';

function makeMember(userId: string | null = USER_ID) {
  return {
    id: MEMBER_ID,
    userId,
    userName: 'テストユーザー',
    guestName: null,
    joinedAt: '2024-01-01T00:00:00Z',
  };
}

function makeLobby(overrides: Partial<LobbyDetail> = {}): LobbyDetail {
  return {
    id: LOBBY_ID,
    title: 'テストロビー',
    description: null,
    scenarioName: null,
    location: null,
    status: LobbyStatus.open,
    isPublished: true,
    maxPlayers: null,
    openUntil: null,
    closedAt: null,
    cancelledAt: null,
    hostUserId: HOST_ID,
    createdAt: '2024-01-01T00:00:00Z',
    updatedAt: '2024-01-01T00:00:00Z',
    members: [],
    ...overrides,
  };
}

function setup(lobby: MaybeRefOrGetter<LobbyDetail | null>) {
  const onMemberAdded = vi.fn();
  const onMemberRemoved = vi.fn();
  return {
    onMemberAdded,
    onMemberRemoved,
    ...useLobbyMembership(LOBBY_ID, lobby, onMemberAdded, onMemberRemoved),
  };
}

beforeEach(() => {
  sessionSubscribers = [];
  currentSessionValue = { data: { user: { id: USER_ID } } };
  vi.clearAllMocks();
  vi.mocked(useToast).mockReturnValue({
    error: vi.fn(),
  } as unknown as ReturnType<typeof useToast>);
});

describe('isHost', () => {
  it('hostUserId が自分の id と一致する場合は true', () => {
    // Arrange
    const lobby = ref(makeLobby({ hostUserId: USER_ID }));

    // Act
    const { isHost } = setup(lobby);

    // Assert
    expect(isHost.value).toBe(true);
  });

  it('hostUserId が自分の id と一致しない場合は false', () => {
    // Arrange
    const lobby = ref(makeLobby({ hostUserId: HOST_ID }));

    // Act
    const { isHost } = setup(lobby);

    // Assert
    expect(isHost.value).toBe(false);
  });

  it('lobby が null の場合は false', () => {
    // Arrange
    const lobby = ref<LobbyDetail | null>(null);

    // Act
    const { isHost } = setup(lobby);

    // Assert
    expect(isHost.value).toBe(false);
  });
});

describe('isMember / myMember', () => {
  it('members に自分の userId を持つメンバーがいる場合 isMember は true', () => {
    // Arrange
    const lobby = ref(makeLobby({ members: [makeMember()] }));

    // Act
    const { isMember, myMember } = setup(lobby);

    // Assert
    expect(isMember.value).toBe(true);
    expect(myMember.value?.id).toBe(MEMBER_ID);
  });

  it('members に自分がいない場合 isMember は false', () => {
    // Arrange
    const lobby = ref(makeLobby({ members: [] }));

    // Act
    const { isMember, myMember } = setup(lobby);

    // Assert
    expect(isMember.value).toBe(false);
    expect(myMember.value).toBeUndefined();
  });

  it('参加直後に members が更新されると isMember / canJoin が追従する', () => {
    // Arrange
    const lobby = ref(
      makeLobby({ status: LobbyStatus.open, hostUserId: HOST_ID, members: [] }),
    );

    // Act
    const { isMember, canJoin } = setup(lobby);

    // Assert（参加前）
    expect(isMember.value).toBe(false);
    expect(canJoin.value).toBe(true);

    // Act（members に自分が追加される）
    lobby.value = { ...lobby.value, members: [makeMember()] };

    // Assert（参加後）
    expect(isMember.value).toBe(true);
    expect(canJoin.value).toBe(false);
  });

  it('セッションが後から変わった場合（subscribe コールバック発火）isMember / canJoin も追従する', () => {
    // Arrange
    currentSessionValue = { data: null };
    const lobby = ref(
      makeLobby({
        status: LobbyStatus.open,
        hostUserId: HOST_ID,
        members: [makeMember(USER_ID)],
      }),
    );

    // Act
    const { isMember, canJoin } = setup(lobby);

    // Assert（未ログインなので自分の member とは判定されない）
    expect(isMember.value).toBe(false);
    expect(canJoin.value).toBe(true);

    // Act（ログイン状態に変わる）
    setSession({ data: { user: { id: USER_ID } } });

    // Assert
    expect(isMember.value).toBe(true);
    expect(canJoin.value).toBe(false);
  });
});

describe('canJoin', () => {
  it('非ホストかつ未参加かつ open ステータスの場合は true', () => {
    // Arrange
    const lobby = ref(
      makeLobby({ status: LobbyStatus.open, hostUserId: HOST_ID, members: [] }),
    );

    // Act
    const { canJoin } = setup(lobby);

    // Assert
    expect(canJoin.value).toBe(true);
  });

  it('自分がホストの場合は false', () => {
    // Arrange
    const lobby = ref(
      makeLobby({ status: LobbyStatus.open, hostUserId: USER_ID, members: [] }),
    );

    // Act
    const { canJoin } = setup(lobby);

    // Assert
    expect(canJoin.value).toBe(false);
  });

  it('すでにメンバーの場合は false', () => {
    // Arrange
    const lobby = ref(
      makeLobby({
        status: LobbyStatus.open,
        hostUserId: HOST_ID,
        members: [makeMember()],
      }),
    );

    // Act
    const { canJoin } = setup(lobby);

    // Assert
    expect(canJoin.value).toBe(false);
  });

  it('open 以外のステータスの場合は false', () => {
    // Arrange
    const lobby = ref(
      makeLobby({
        status: LobbyStatus.draft,
        hostUserId: HOST_ID,
        members: [],
      }),
    );

    // Act
    const { canJoin } = setup(lobby);

    // Assert
    expect(canJoin.value).toBe(false);
  });

  it('lobby が null の場合は false', () => {
    // Arrange
    const lobby = ref<LobbyDetail | null>(null);

    // Act
    const { canJoin } = setup(lobby);

    // Assert
    expect(canJoin.value).toBe(false);
  });
});

describe('canLeave', () => {
  it('自分がメンバーかつ open の場合は true', () => {
    // Arrange
    const lobby = ref(
      makeLobby({
        status: LobbyStatus.open,
        hostUserId: HOST_ID,
        members: [makeMember()],
      }),
    );

    // Act
    const { canLeave } = setup(lobby);

    // Assert
    expect(canLeave.value).toBe(true);
  });

  it('自分がメンバーかつ scheduling の場合も true', () => {
    // Arrange
    const lobby = ref(
      makeLobby({
        status: LobbyStatus.scheduling,
        hostUserId: HOST_ID,
        members: [makeMember()],
      }),
    );

    // Act
    const { canLeave } = setup(lobby);

    // Assert
    expect(canLeave.value).toBe(true);
  });

  it('自分がメンバーでない場合は false', () => {
    // Arrange
    const lobby = ref(
      makeLobby({ status: LobbyStatus.open, hostUserId: HOST_ID, members: [] }),
    );

    // Act
    const { canLeave } = setup(lobby);

    // Assert
    expect(canLeave.value).toBe(false);
  });

  it('open / scheduling 以外のステータスの場合は false', () => {
    // Arrange
    const lobby = ref(
      makeLobby({
        status: LobbyStatus.confirmed,
        hostUserId: HOST_ID,
        members: [makeMember()],
      }),
    );

    // Act
    const { canLeave } = setup(lobby);

    // Assert
    expect(canLeave.value).toBe(false);
  });

  it('自分がホストの場合は false', () => {
    // Arrange
    const lobby = ref(
      makeLobby({
        status: LobbyStatus.open,
        hostUserId: USER_ID,
        members: [makeMember()],
      }),
    );

    // Act
    const { canLeave } = setup(lobby);

    // Assert
    expect(canLeave.value).toBe(false);
  });
});

describe('canRemoveMember', () => {
  it('ホストかつ open の場合は true', () => {
    // Arrange
    const lobby = ref(
      makeLobby({ status: LobbyStatus.open, hostUserId: USER_ID }),
    );

    // Act
    const { canRemoveMember } = setup(lobby);

    // Assert
    expect(canRemoveMember.value).toBe(true);
  });

  it('ホストかつ scheduling の場合は true', () => {
    // Arrange
    const lobby = ref(
      makeLobby({ status: LobbyStatus.scheduling, hostUserId: USER_ID }),
    );

    // Act
    const { canRemoveMember } = setup(lobby);

    // Assert
    expect(canRemoveMember.value).toBe(true);
  });

  it('ホストでない場合は false', () => {
    // Arrange
    const lobby = ref(
      makeLobby({ status: LobbyStatus.open, hostUserId: HOST_ID }),
    );

    // Act
    const { canRemoveMember } = setup(lobby);

    // Assert
    expect(canRemoveMember.value).toBe(false);
  });

  it('open / scheduling 以外のステータスの場合は false', () => {
    // Arrange
    const lobby = ref(
      makeLobby({ status: LobbyStatus.confirmed, hostUserId: USER_ID }),
    );

    // Act
    const { canRemoveMember } = setup(lobby);

    // Assert
    expect(canRemoveMember.value).toBe(false);
  });
});

describe('join', () => {
  it('API を呼び出して onMemberAdded に作成されたメンバーを渡す', async () => {
    // Arrange
    const member = makeMember();
    vi.mocked(joinLobby).mockResolvedValue(member);
    const lobby = ref(makeLobby({ members: [] }));

    // Act
    const { join, onMemberAdded } = setup(lobby);
    await join();

    // Assert
    expect(joinLobby).toHaveBeenCalledWith(LOBBY_ID, {});
    expect(onMemberAdded).toHaveBeenCalledWith(member);
  });

  it('API 呼び出し中は loading が true になる', async () => {
    // Arrange
    let resolveJoin!: () => void;
    vi.mocked(joinLobby).mockReturnValue(
      new Promise((resolve) => {
        resolveJoin = () => resolve(makeMember());
      }),
    );
    const lobby = ref(makeLobby({ members: [] }));
    const { join, loading } = setup(lobby);

    // Act
    const joinPromise = join();
    expect(loading.value).toBe(true);
    resolveJoin();
    await joinPromise;

    // Assert
    expect(loading.value).toBe(false);
  });

  it('API が失敗した場合は toast.error を呼び出す', async () => {
    // Arrange
    const toastError = vi.fn();
    vi.mocked(useToast).mockReturnValue({
      error: toastError,
    } as unknown as ReturnType<typeof useToast>);
    vi.mocked(joinLobby).mockRejectedValue(new Error('API error'));
    const lobby = ref(makeLobby({ members: [] }));

    // Act
    const { join, onMemberAdded } = setup(lobby);
    await join();

    // Assert
    expect(toastError).toHaveBeenCalledWith('参加に失敗しました');
    expect(onMemberAdded).not.toHaveBeenCalled();
  });

  it('二重送信を防ぐ（loading 中は再呼び出しを無視する）', async () => {
    // Arrange
    let resolveJoin!: () => void;
    vi.mocked(joinLobby).mockReturnValue(
      new Promise((resolve) => {
        resolveJoin = () => resolve(makeMember());
      }),
    );
    const lobby = ref(makeLobby({ members: [] }));
    const { join } = setup(lobby);

    // Act
    const first = join();
    const second = join();
    resolveJoin();
    await Promise.all([first, second]);

    // Assert
    expect(joinLobby).toHaveBeenCalledTimes(1);
  });
});

describe('leave', () => {
  it('API を myMember の id で呼び出して onMemberRemoved に memberId を渡す', async () => {
    // Arrange
    vi.mocked(leaveLobby).mockResolvedValue(undefined);
    const lobby = ref(makeLobby({ members: [makeMember()] }));

    // Act
    const { leave, onMemberRemoved } = setup(lobby);
    await leave();

    // Assert
    expect(leaveLobby).toHaveBeenCalledWith(LOBBY_ID, MEMBER_ID);
    expect(onMemberRemoved).toHaveBeenCalledWith(MEMBER_ID);
  });

  it('自分がメンバーでない場合は API を呼び出さない', async () => {
    // Arrange
    const lobby = ref(makeLobby({ members: [] }));

    // Act
    const { leave, onMemberRemoved } = setup(lobby);
    await leave();

    // Assert
    expect(leaveLobby).not.toHaveBeenCalled();
    expect(onMemberRemoved).not.toHaveBeenCalled();
  });

  it('API が失敗した場合は toast.error を呼び出す', async () => {
    // Arrange
    const toastError = vi.fn();
    vi.mocked(useToast).mockReturnValue({
      error: toastError,
    } as unknown as ReturnType<typeof useToast>);
    vi.mocked(leaveLobby).mockRejectedValue(new Error('API error'));
    const lobby = ref(makeLobby({ members: [makeMember()] }));

    // Act
    const { leave, onMemberRemoved } = setup(lobby);
    await leave();

    // Assert
    expect(toastError).toHaveBeenCalledWith('退出に失敗しました');
    expect(onMemberRemoved).not.toHaveBeenCalled();
  });

  it('二重送信を防ぐ（loading 中は再呼び出しを無視する）', async () => {
    // Arrange
    let resolveLeave!: () => void;
    vi.mocked(leaveLobby).mockReturnValue(
      new Promise((resolve) => {
        resolveLeave = () => resolve(undefined);
      }),
    );
    const lobby = ref(makeLobby({ members: [makeMember()] }));
    const { leave } = setup(lobby);

    // Act
    const first = leave();
    const second = leave();
    resolveLeave();
    await Promise.all([first, second]);

    // Assert
    expect(leaveLobby).toHaveBeenCalledTimes(1);
  });
});

describe('removeMember', () => {
  it('ホストが指定 memberId で API を呼び出して onMemberRemoved に memberId を渡す', async () => {
    // Arrange
    vi.mocked(leaveLobby).mockResolvedValue(undefined);
    const lobby = ref(
      makeLobby({
        status: LobbyStatus.open,
        hostUserId: USER_ID,
        members: [makeMember('other-user')],
      }),
    );

    // Act
    const { removeMember, onMemberRemoved } = setup(lobby);
    await removeMember(MEMBER_ID);

    // Assert
    expect(leaveLobby).toHaveBeenCalledWith(LOBBY_ID, MEMBER_ID);
    expect(onMemberRemoved).toHaveBeenCalledWith(MEMBER_ID);
  });

  it('canRemoveMember が false（非ホスト）の場合は API を呼び出さない', async () => {
    // Arrange
    const lobby = ref(
      makeLobby({
        status: LobbyStatus.open,
        hostUserId: HOST_ID,
        members: [makeMember()],
      }),
    );

    // Act
    const { removeMember, onMemberRemoved } = setup(lobby);
    await removeMember(MEMBER_ID);

    // Assert
    expect(leaveLobby).not.toHaveBeenCalled();
    expect(onMemberRemoved).not.toHaveBeenCalled();
  });

  it('API が失敗した場合は toast.error を呼び出す', async () => {
    // Arrange
    const toastError = vi.fn();
    vi.mocked(useToast).mockReturnValue({
      error: toastError,
    } as unknown as ReturnType<typeof useToast>);
    vi.mocked(leaveLobby).mockRejectedValue(new Error('API error'));
    const lobby = ref(
      makeLobby({
        status: LobbyStatus.open,
        hostUserId: USER_ID,
        members: [makeMember('other-user')],
      }),
    );

    // Act
    const { removeMember, onMemberRemoved } = setup(lobby);
    await removeMember(MEMBER_ID);

    // Assert
    expect(toastError).toHaveBeenCalledWith('メンバーの取り消しに失敗しました');
    expect(onMemberRemoved).not.toHaveBeenCalled();
  });

  it('二重送信を防ぐ（loading 中は再呼び出しを無視する）', async () => {
    // Arrange
    let resolveRemove!: () => void;
    vi.mocked(leaveLobby).mockReturnValue(
      new Promise((resolve) => {
        resolveRemove = () => resolve(undefined);
      }),
    );
    const lobby = ref(
      makeLobby({
        status: LobbyStatus.open,
        hostUserId: USER_ID,
        members: [makeMember('other-user')],
      }),
    );
    const { removeMember } = setup(lobby);

    // Act
    const first = removeMember(MEMBER_ID);
    const second = removeMember(MEMBER_ID);
    resolveRemove();
    await Promise.all([first, second]);

    // Assert
    expect(leaveLobby).toHaveBeenCalledTimes(1);
  });
});
