import { describe, it, expect, vi, beforeEach } from 'vitest';
import { ref } from 'vue';
import type { MaybeRefOrGetter } from 'vue';
import { createPinia, setActivePinia } from 'pinia';
import { useGameSessionMembership } from '@/features/GameSession/Detail/useGameSessionMembership';
import { GameSessionStatus } from '@taku-biyori/shared';
import type { LegacyGameSessionDetail } from '@taku-biyori/shared';

vi.mock('@/api/legacy-game-session', () => ({
  joinGameSession: vi.fn(),
  leaveGameSession: vi.fn(),
}));

vi.mock('@/stores/auth', () => ({
  useAuthStore: vi.fn(),
}));

vi.mock('@/composables/useToast', () => ({
  useToast: vi.fn(() => ({ error: vi.fn() })),
}));

import { joinGameSession, leaveGameSession } from '@/api/legacy-game-session';
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
  overrides: Partial<LegacyGameSessionDetail> = {},
): LegacyGameSessionDetail {
  return {
    id: SESSION_ID,
    title: 'テストセッション',
    // NOTE: 段階6b 以降 open は導出されないため、参加・退出ともに許可される
    //       confirmed（公開済み・実施前）を既定値にする。
    status: GameSessionStatus.confirmed,
    isPublished: true,
    scheduledAt: '2026-08-01',
    createdBy: HOST_ID,
    createdAt: '2024-01-01T00:00:00Z',
    updatedAt: '2024-01-01T00:00:00Z',
    members: [],
    ...overrides,
  };
}

function setup(gameSession: MaybeRefOrGetter<LegacyGameSessionDetail | null>) {
  const onRefresh = vi.fn();
  return {
    onRefresh,
    ...useGameSessionMembership(SESSION_ID, gameSession, onRefresh),
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
  // LEGACY_ACTION_POLICIES.joinSession の statuses（confirmed / today）に従う
  it.each([GameSessionStatus.confirmed, GameSessionStatus.today] as const)(
    '未参加かつ %s ステータスのセッションでは true',
    (status) => {
      // Arrange
      const gameSession = ref(makeGameSession({ status, members: [] }));

      // Act
      const { canJoin } = setup(gameSession);

      // Assert
      expect(canJoin.value).toBe(true);
    },
  );

  // 卓側のゲスト参加を廃止したため、未ログインでは参加導線を出さない。
  // 出してしまうと押した先の POST が 401 になる。
  it('未ログインの場合は false', () => {
    // Arrange
    vi.mocked(useAuthStore).mockReturnValue({
      currentUser: null,
    } as unknown as ReturnType<typeof useAuthStore>);
    const gameSession = ref(
      makeGameSession({ status: GameSessionStatus.confirmed, members: [] }),
    );

    // Act
    const { canJoin } = setup(gameSession);

    // Assert
    expect(canJoin.value).toBe(false);
  });

  it('すでにメンバーの場合は false', () => {
    const gameSession = ref(
      makeGameSession({
        status: GameSessionStatus.confirmed,
        members: [makeMember()],
      }),
    );

    // Act
    const { canJoin } = setup(gameSession);

    // Assert
    expect(canJoin.value).toBe(false);
  });

  it.each([
    GameSessionStatus.draft,
    GameSessionStatus.completed,
    GameSessionStatus.cancelled,
  ] as const)('参加できない %s ステータスの場合は false', (status) => {
    // Arrange
    const gameSession = ref(makeGameSession({ status, members: [] }));

    // Act
    const { canJoin } = setup(gameSession);

    // Assert
    expect(canJoin.value).toBe(false);
  });

  it('gameSession が null の場合は false', () => {
    const gameSession = ref<LegacyGameSessionDetail | null>(null);

    // Act
    const { canJoin } = setup(gameSession);

    // Assert
    expect(canJoin.value).toBe(false);
  });
});

describe('join', () => {
  it('API を呼び出して onRefresh を実行する', async () => {
    vi.mocked(joinGameSession).mockResolvedValue({
      id: MEMBER_ID,
      userId: USER_ID,
      userName: 'テストユーザー',
      guestName: null,
      characterName: null,
      joinedAt: '2024-01-01T00:00:00Z',
    });

    const gameSession = ref(makeGameSession({ members: [] }));

    // Act
    const { join, onRefresh } = setup(gameSession);
    await join();

    // Assert
    expect(joinGameSession).toHaveBeenCalledWith(SESSION_ID, {});
    expect(onRefresh).toHaveBeenCalled();
  });

  it('API 呼び出し中は loading が true になる', async () => {
    let resolveJoin!: () => void;
    vi.mocked(joinGameSession).mockReturnValue(
      new Promise((resolve) => {
        resolveJoin = () =>
          resolve({
            id: MEMBER_ID,
            userId: USER_ID,
            userName: 'テストユーザー',
            guestName: null,
            characterName: null,
            joinedAt: '2024-01-01T00:00:00Z',
          });
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
    const { join, onRefresh } = setup(gameSession);
    await join();

    // Assert
    expect(toastError).toHaveBeenCalledWith('参加に失敗しました');
    expect(onRefresh).not.toHaveBeenCalled();
  });

  it('二重送信を防ぐ（loading 中は再呼び出しを無視する）', async () => {
    let resolveJoin!: () => void;
    vi.mocked(joinGameSession).mockReturnValue(
      new Promise((resolve) => {
        resolveJoin = () =>
          resolve({
            id: MEMBER_ID,
            userId: USER_ID,
            userName: 'テストユーザー',
            guestName: null,
            characterName: null,
            joinedAt: '2024-01-01T00:00:00Z',
          });
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
  // LEGACY_ACTION_POLICIES.leaveSession の statuses（confirmed / today）に従う
  it.each([GameSessionStatus.confirmed, GameSessionStatus.today] as const)(
    '自分がメンバーで %s ステータスの場合は true',
    (status) => {
      // Arrange
      const gameSession = ref(
        makeGameSession({ status, members: [makeMember()] }),
      );

      // Act
      const { canLeave } = setup(gameSession);

      // Assert
      expect(canLeave.value).toBe(true);
    },
  );

  it('自分がメンバーでない場合は false', () => {
    // Arrange
    const gameSession = ref(makeGameSession({ members: [] }));

    // Act
    const { canLeave } = setup(gameSession);

    // Assert
    expect(canLeave.value).toBe(false);
  });

  it.each([
    GameSessionStatus.draft,
    GameSessionStatus.completed,
    GameSessionStatus.cancelled,
  ] as const)('退出できない %s ステータスの場合は false', (status) => {
    // Arrange
    const gameSession = ref(
      makeGameSession({ status, members: [makeMember()] }),
    );

    // Act
    const { canLeave } = setup(gameSession);

    // Assert
    expect(canLeave.value).toBe(false);
  });

  it('gameSession が null の場合は false', () => {
    // Arrange
    const gameSession = ref<LegacyGameSessionDetail | null>(null);

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
  it('API を memberId で呼び出して onRefresh を実行する', async () => {
    vi.mocked(leaveGameSession).mockResolvedValue(undefined);
    const gameSession = ref(makeGameSession({ members: [makeMember()] }));

    // Act
    const { leave, onRefresh } = setup(gameSession);
    await leave();

    // Assert
    expect(leaveGameSession).toHaveBeenCalledWith(SESSION_ID, MEMBER_ID);
    expect(onRefresh).toHaveBeenCalled();
  });

  it('自分がメンバーでない場合は API を呼び出さない', async () => {
    // Arrange
    const gameSession = ref(makeGameSession({ members: [] }));

    // Act
    const { leave, onRefresh } = setup(gameSession);
    await leave();

    // Assert
    expect(leaveGameSession).not.toHaveBeenCalled();
    expect(onRefresh).not.toHaveBeenCalled();
  });

  it('API が失敗した場合は toast.error を呼び出す', async () => {
    const toastError = vi.fn();
    vi.mocked(useToast).mockReturnValue({
      error: toastError,
    } as unknown as ReturnType<typeof useToast>);
    vi.mocked(leaveGameSession).mockRejectedValue(new Error('API error'));
    const gameSession = ref(makeGameSession({ members: [makeMember()] }));

    // Act
    const { leave, onRefresh } = setup(gameSession);
    await leave();

    // Assert
    expect(toastError).toHaveBeenCalledWith('退出に失敗しました');
    expect(onRefresh).not.toHaveBeenCalled();
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
