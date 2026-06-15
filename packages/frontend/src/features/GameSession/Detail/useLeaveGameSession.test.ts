import { describe, it, expect, vi, beforeEach } from 'vitest';
import { ref } from 'vue';
import { createPinia, setActivePinia } from 'pinia';
import { useLeaveGameSession } from '@/features/GameSession/Detail/useLeaveGameSession';
import { GameSessionStatus } from '@taku-biyori/shared';
import type { GameSessionDetail } from '@taku-biyori/shared';

vi.mock('@/api/game-session', () => ({
  leaveGameSession: vi.fn(),
}));

vi.mock('@/stores/auth', () => ({
  useAuthStore: vi.fn(),
}));

vi.mock('@/composables/useToast', () => ({
  useToast: vi.fn(() => ({ error: vi.fn() })),
}));

import { leaveGameSession } from '@/api/game-session';
import { useAuthStore } from '@/stores/auth';
import { useToast } from '@/composables/useToast';

const SESSION_ID = 'session-1';
const USER_ID = 'user-1';
const MEMBER_ID = 'member-1';

function makeGameSession(
  overrides: Partial<GameSessionDetail> = {},
): GameSessionDetail {
  return {
    id: SESSION_ID,
    title: 'テストセッション',
    status: GameSessionStatus.open,
    isPublished: true,
    createdBy: 'host-1',
    createdAt: '2024-01-01T00:00:00Z',
    updatedAt: '2024-01-01T00:00:00Z',
    members: [],
    ...overrides,
  };
}

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

beforeEach(() => {
  setActivePinia(createPinia());
  vi.clearAllMocks();
  vi.mocked(useAuthStore).mockReturnValue({
    currentUser: { id: USER_ID },
  } as ReturnType<typeof useAuthStore>);
  vi.mocked(useToast).mockReturnValue({ error: vi.fn() } as ReturnType<
    typeof useToast
  >);
});

describe('canLeave', () => {
  it('自分がメンバーの場合は true', () => {
    const gameSession = ref(
      makeGameSession({ members: [makeMember(USER_ID)] }),
    );

    // Act
    const { canLeave } = useLeaveGameSession(SESSION_ID, gameSession);

    // Assert
    expect(canLeave.value).toBe(true);
  });

  it('自分がメンバーでない場合は false', () => {
    const gameSession = ref(makeGameSession({ members: [] }));

    // Act
    const { canLeave } = useLeaveGameSession(SESSION_ID, gameSession);

    // Assert
    expect(canLeave.value).toBe(false);
  });

  it('gameSession が null の場合は false', () => {
    const gameSession = ref<GameSessionDetail | null>(null);

    // Act
    const { canLeave } = useLeaveGameSession(SESSION_ID, gameSession);

    // Assert
    expect(canLeave.value).toBe(false);
  });
});

describe('leave', () => {
  it('API を memberId で呼び出してメンバーリストから自分を削除する', async () => {
    vi.mocked(leaveGameSession).mockResolvedValue(undefined);

    const gameSession = ref(
      makeGameSession({ members: [makeMember(USER_ID)] }),
    );

    // Act
    const { leave } = useLeaveGameSession(SESSION_ID, gameSession);
    await leave();

    // Assert
    expect(leaveGameSession).toHaveBeenCalledWith(SESSION_ID, MEMBER_ID);
    expect(gameSession.value?.members).toHaveLength(0);
  });

  it('自分がメンバーでない場合は API を呼び出さない', async () => {
    const gameSession = ref(makeGameSession({ members: [] }));

    // Act
    const { leave } = useLeaveGameSession(SESSION_ID, gameSession);
    await leave();

    // Assert
    expect(leaveGameSession).not.toHaveBeenCalled();
  });

  it('API 呼び出し中は loading が true になる', async () => {
    let resolveLeave!: () => void;
    vi.mocked(leaveGameSession).mockReturnValue(
      new Promise((resolve) => {
        resolveLeave = () => resolve(undefined);
      }),
    );

    const gameSession = ref(
      makeGameSession({ members: [makeMember(USER_ID)] }),
    );
    const { leave, loading } = useLeaveGameSession(SESSION_ID, gameSession);

    // Act
    const leavePromise = leave();
    expect(loading.value).toBe(true);

    resolveLeave();
    await leavePromise;

    // Assert
    expect(loading.value).toBe(false);
  });

  it('API が失敗した場合は toast.error を呼び出す', async () => {
    const toastError = vi.fn();
    vi.mocked(useToast).mockReturnValue({
      error: toastError,
    } as ReturnType<typeof useToast>);
    vi.mocked(leaveGameSession).mockRejectedValue(new Error('API error'));

    const gameSession = ref(
      makeGameSession({ members: [makeMember(USER_ID)] }),
    );

    // Act
    const { leave } = useLeaveGameSession(SESSION_ID, gameSession);
    await leave();

    // Assert
    expect(toastError).toHaveBeenCalledWith('退出に失敗しました');
  });

  it('二重送信を防ぐ（loading 中は再呼び出しを無視する）', async () => {
    let resolveLeave!: () => void;
    vi.mocked(leaveGameSession).mockReturnValue(
      new Promise((resolve) => {
        resolveLeave = () => resolve(undefined);
      }),
    );

    const gameSession = ref(
      makeGameSession({ members: [makeMember(USER_ID)] }),
    );
    const { leave } = useLeaveGameSession(SESSION_ID, gameSession);

    // Act
    const first = leave();
    const second = leave();
    resolveLeave();
    await Promise.all([first, second]);

    // Assert
    expect(leaveGameSession).toHaveBeenCalledTimes(1);
  });
});
