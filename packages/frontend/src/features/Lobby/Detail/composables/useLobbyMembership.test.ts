import { describe, it, expect, vi, beforeEach } from 'vitest';
import { ref } from 'vue';
import type { MaybeRefOrGetter } from 'vue';
import { createPinia, setActivePinia } from 'pinia';
import { useLobbyMembership } from '@/features/Lobby/Detail/composables/useLobbyMembership';
import { LobbyStatus } from '@taku-biyori/shared';
import type { LobbyDetail } from '@taku-biyori/shared';

vi.mock('@/api/lobby', () => ({
  joinLobby: vi.fn(),
  leaveLobby: vi.fn(),
}));

vi.mock('@/stores/auth', () => ({
  useAuthStore: vi.fn(),
}));

vi.mock('@/composables/useToast', () => ({
  useToast: vi.fn(() => ({ error: vi.fn() })),
}));

import { joinLobby, leaveLobby } from '@/api/lobby';
import { useAuthStore } from '@/stores/auth';
import { useToast } from '@/composables/useToast';

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
  const onRefresh = vi.fn();
  return {
    onRefresh,
    ...useLobbyMembership(LOBBY_ID, lobby, onRefresh),
  };
}

beforeEach(() => {
  setActivePinia(createPinia());
  vi.clearAllMocks();
  vi.mocked(useAuthStore).mockReturnValue({
    currentUser: { id: USER_ID },
  } as ReturnType<typeof useAuthStore>);
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
  it('API を呼び出して onRefresh を実行する', async () => {
    // Arrange
    vi.mocked(joinLobby).mockResolvedValue(makeMember());
    const lobby = ref(makeLobby({ members: [] }));

    // Act
    const { join, onRefresh } = setup(lobby);
    await join();

    // Assert
    expect(joinLobby).toHaveBeenCalledWith(LOBBY_ID, {});
    expect(onRefresh).toHaveBeenCalled();
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
    const { join, onRefresh } = setup(lobby);
    await join();

    // Assert
    expect(toastError).toHaveBeenCalledWith('参加に失敗しました');
    expect(onRefresh).not.toHaveBeenCalled();
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
  it('API を myMember の id で呼び出して onRefresh を実行する', async () => {
    // Arrange
    vi.mocked(leaveLobby).mockResolvedValue(undefined);
    const lobby = ref(makeLobby({ members: [makeMember()] }));

    // Act
    const { leave, onRefresh } = setup(lobby);
    await leave();

    // Assert
    expect(leaveLobby).toHaveBeenCalledWith(LOBBY_ID, MEMBER_ID);
    expect(onRefresh).toHaveBeenCalled();
  });

  it('自分がメンバーでない場合は API を呼び出さない', async () => {
    // Arrange
    const lobby = ref(makeLobby({ members: [] }));

    // Act
    const { leave, onRefresh } = setup(lobby);
    await leave();

    // Assert
    expect(leaveLobby).not.toHaveBeenCalled();
    expect(onRefresh).not.toHaveBeenCalled();
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
    const { leave, onRefresh } = setup(lobby);
    await leave();

    // Assert
    expect(toastError).toHaveBeenCalledWith('退出に失敗しました');
    expect(onRefresh).not.toHaveBeenCalled();
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
  it('ホストが指定 memberId で API を呼び出して onRefresh を実行する', async () => {
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
    const { removeMember, onRefresh } = setup(lobby);
    await removeMember(MEMBER_ID);

    // Assert
    expect(leaveLobby).toHaveBeenCalledWith(LOBBY_ID, MEMBER_ID);
    expect(onRefresh).toHaveBeenCalled();
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
    const { removeMember, onRefresh } = setup(lobby);
    await removeMember(MEMBER_ID);

    // Assert
    expect(leaveLobby).not.toHaveBeenCalled();
    expect(onRefresh).not.toHaveBeenCalled();
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
    const { removeMember, onRefresh } = setup(lobby);
    await removeMember(MEMBER_ID);

    // Assert
    expect(toastError).toHaveBeenCalledWith('メンバーの取り消しに失敗しました');
    expect(onRefresh).not.toHaveBeenCalled();
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
