import { describe, it, expect, vi, beforeEach } from 'vitest';
import { ref } from 'vue';
import type { MaybeRefOrGetter } from 'vue';
import { createPinia, setActivePinia } from 'pinia';
import { useGameSessionMembership } from '@/features/GameSession/Detail/useGameSessionMembership';
import { GameSessionStatus } from '@taku-biyori/shared';
import type { GameSessionDetail } from '@taku-biyori/shared';

vi.mock('@/api/game-session', () => ({
  joinGameSession: vi.fn(),
  leaveGameSession: vi.fn(),
}));

vi.mock('@/stores/auth', () => ({
  useAuthStore: vi.fn(),
}));

vi.mock('@/composables/useToast', () => ({
  useToast: vi.fn(() => ({ error: vi.fn() })),
}));

import { joinGameSession, leaveGameSession } from '@/api/game-session';
import { useAuthStore } from '@/stores/auth';
import { useToast } from '@/composables/useToast';

const SESSION_ID = 'session-1';
const USER_ID = 'user-1';
const HOST_ID = 'host-1';
const MEMBER_ID = 'member-1';

function makeMember(userId: string | null = USER_ID) {
  return {
    id: MEMBER_ID,
    userId,
    userName: 'テストユーザー',
    guestName: null,
    characterName: null,
    joinedAt: '2024-01-01T00:00:00Z',
  };
}

function makeGameSession(
  overrides: Partial<GameSessionDetail> = {},
): GameSessionDetail {
  return {
    id: SESSION_ID,
    title: 'テストセッション',
    status: GameSessionStatus.open,
    isPublished: true,
    createdBy: HOST_ID,
    createdAt: '2024-01-01T00:00:00Z',
    updatedAt: '2024-01-01T00:00:00Z',
    members: [],
    ...overrides,
  };
}

// 書き込みは callback で親へ委譲する契約なので、テストでは spy を渡して検証する。
function setup(gameSession: MaybeRefOrGetter<GameSessionDetail | null>) {
  const onJoined = vi.fn();
  const onLeft = vi.fn();
  return {
    onJoined,
    onLeft,
    ...useGameSessionMembership(SESSION_ID, gameSession, onJoined, onLeft),
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

describe('canJoin', () => {
  it('未参加かつ open ステータスのセッションでは true', () => {
    const gameSession = ref(
      makeGameSession({ status: GameSessionStatus.open, members: [] }),
    );

    // Act
    const { canJoin } = setup(gameSession);

    // Assert
    expect(canJoin.value).toBe(true);
  });

  it('すでにメンバーの場合は false', () => {
    const gameSession = ref(
      makeGameSession({
        status: GameSessionStatus.open,
        members: [makeMember()],
      }),
    );

    // Act
    const { canJoin } = setup(gameSession);

    // Assert
    expect(canJoin.value).toBe(false);
  });

  it('open 以外のステータスの場合は false', () => {
    const gameSession = ref(
      makeGameSession({ status: GameSessionStatus.draft, members: [] }),
    );

    // Act
    const { canJoin } = setup(gameSession);

    // Assert
    expect(canJoin.value).toBe(false);
  });

  it('gameSession が null の場合は false', () => {
    const gameSession = ref<GameSessionDetail | null>(null);

    // Act
    const { canJoin } = setup(gameSession);

    // Assert
    expect(canJoin.value).toBe(false);
  });
});

describe('join', () => {
  it('API を呼び出して onJoined に新メンバーを渡す', async () => {
    const newMember = makeMember();
    vi.mocked(joinGameSession).mockResolvedValue(newMember);

    const gameSession = ref(makeGameSession({ members: [] }));

    // Act
    const { join, onJoined } = setup(gameSession);
    await join();

    // Assert
    expect(joinGameSession).toHaveBeenCalledWith(SESSION_ID, {});
    expect(onJoined).toHaveBeenCalledWith(newMember);
  });

  it('API 呼び出し中は loading が true になる', async () => {
    let resolveJoin!: () => void;
    vi.mocked(joinGameSession).mockReturnValue(
      new Promise((resolve) => {
        resolveJoin = () => resolve(makeMember());
      }),
    );

    const gameSession = ref(makeGameSession({ members: [] }));
    const { join, loading } = setup(gameSession);

    // Act
    const joinPromise = join();
    expect(loading.value).toBe(true);

    resolveJoin();
    await joinPromise;

    // Assert
    expect(loading.value).toBe(false);
  });

  it('API が失敗した場合は toast.error を呼び出す', async () => {
    const toastError = vi.fn();
    vi.mocked(useToast).mockReturnValue({
      error: toastError,
    } as unknown as ReturnType<typeof useToast>);
    vi.mocked(joinGameSession).mockRejectedValue(new Error('API error'));

    const gameSession = ref(makeGameSession({ members: [] }));

    // Act
    const { join, onJoined } = setup(gameSession);
    await join();

    // Assert
    expect(toastError).toHaveBeenCalledWith('参加に失敗しました');
    expect(onJoined).not.toHaveBeenCalled();
  });

  it('二重送信を防ぐ（loading 中は再呼び出しを無視する）', async () => {
    let resolveJoin!: () => void;
    vi.mocked(joinGameSession).mockReturnValue(
      new Promise((resolve) => {
        resolveJoin = () => resolve(makeMember());
      }),
    );

    const gameSession = ref(makeGameSession({ members: [] }));
    const { join } = setup(gameSession);

    // Act
    const first = join();
    const second = join();
    resolveJoin();
    await Promise.all([first, second]);

    // Assert
    expect(joinGameSession).toHaveBeenCalledTimes(1);
  });
});

describe('canLeave', () => {
  it('自分がメンバーの場合は true', () => {
    // Arrange
    const gameSession = ref(makeGameSession({ members: [makeMember()] }));

    // Act
    const { canLeave } = setup(gameSession);

    // Assert
    expect(canLeave.value).toBe(true);
  });

  it('自分がメンバーでない場合は false', () => {
    // Arrange
    const gameSession = ref(makeGameSession({ members: [] }));

    // Act
    const { canLeave } = setup(gameSession);

    // Assert
    expect(canLeave.value).toBe(false);
  });

  it('open 以外のステータスの場合は false', () => {
    // Arrange
    const gameSession = ref(
      makeGameSession({
        status: GameSessionStatus.confirmed,
        members: [makeMember()],
      }),
    );

    // Act
    const { canLeave } = setup(gameSession);

    // Assert
    expect(canLeave.value).toBe(false);
  });

  it('自分がホスト（GM）の場合は false', () => {
    // Arrange: USER_ID をホストに設定
    const gameSession = ref(
      makeGameSession({ createdBy: USER_ID, members: [makeMember()] }),
    );

    // Act
    const { canLeave } = setup(gameSession);

    // Assert
    expect(canLeave.value).toBe(false);
  });
});

describe('leave', () => {
  it('API を memberId で呼び出して onLeft に memberId を渡す', async () => {
    vi.mocked(leaveGameSession).mockResolvedValue(undefined);
    const gameSession = ref(makeGameSession({ members: [makeMember()] }));

    // Act
    const { leave, onLeft } = setup(gameSession);
    await leave();

    // Assert
    expect(leaveGameSession).toHaveBeenCalledWith(SESSION_ID, MEMBER_ID);
    expect(onLeft).toHaveBeenCalledWith(MEMBER_ID);
  });

  it('自分がメンバーでない場合は API を呼び出さない', async () => {
    // Arrange
    const gameSession = ref(makeGameSession({ members: [] }));

    // Act
    const { leave, onLeft } = setup(gameSession);
    await leave();

    // Assert
    expect(leaveGameSession).not.toHaveBeenCalled();
    expect(onLeft).not.toHaveBeenCalled();
  });

  it('API が失敗した場合は toast.error を呼び出す', async () => {
    const toastError = vi.fn();
    vi.mocked(useToast).mockReturnValue({
      error: toastError,
    } as unknown as ReturnType<typeof useToast>);
    vi.mocked(leaveGameSession).mockRejectedValue(new Error('API error'));
    const gameSession = ref(makeGameSession({ members: [makeMember()] }));

    // Act
    const { leave, onLeft } = setup(gameSession);
    await leave();

    // Assert
    expect(toastError).toHaveBeenCalledWith('退出に失敗しました');
    expect(onLeft).not.toHaveBeenCalled();
  });

  it('二重送信を防ぐ（loading 中は再呼び出しを無視する）', async () => {
    let resolveLeave!: () => void;
    vi.mocked(leaveGameSession).mockReturnValue(
      new Promise((resolve) => {
        resolveLeave = () => resolve(undefined);
      }),
    );
    const gameSession = ref(makeGameSession({ members: [makeMember()] }));
    const { leave } = setup(gameSession);

    // Act
    const first = leave();
    const second = leave();
    resolveLeave();
    await Promise.all([first, second]);

    // Assert
    expect(leaveGameSession).toHaveBeenCalledTimes(1);
  });
});
