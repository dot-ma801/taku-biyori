import { describe, it, expect, vi, beforeEach } from 'vitest';
import { ref } from 'vue';
import { createPinia, setActivePinia } from 'pinia';
import { useGameSessionStatus } from '@/features/GameSession/Detail/useGameSessionStatus';
import { GameSessionStatus, LobbyStatus } from '@taku-biyori/shared';
import type { GameSessionDetailModel, SeatModel } from '@/models/game-session';

vi.mock('@/api/game-session', () => ({
  updateGameSessionStatus: vi.fn(),
  deleteGameSession: vi.fn(),
}));

vi.mock('@/stores/auth', () => ({
  useAuthStore: vi.fn(),
}));

const mockToastSuccess = vi.fn();
const mockToastError = vi.fn();
vi.mock('@/composables/useToast', () => ({
  useToast: () => ({ success: mockToastSuccess, error: mockToastError }),
}));

const mockRouterPush = vi.fn();
vi.mock('vue-router', () => ({
  useRouter: vi.fn(() => ({ push: mockRouterPush })),
}));

import { updateGameSessionStatus, deleteGameSession } from '@/api/game-session';
import { useAuthStore } from '@/stores/auth';

const HOST_USER_ID = 'host-user-id';
const OTHER_USER_ID = 'other-user-id';
const LOBBY_ID = 'lobby-1';
const SESSION_ID = 'session-1';

const makeSeat = (userId: string | null): SeatModel => ({
  id: `seat-${userId ?? 'guest'}`,
  entryId: `entry-${userId ?? 'guest'}`,
  userId,
  userName: userId ? 'ユーザー' : null,
  guestName: userId ? null : 'ゲスト',
  characterName: null,
  seatedAt: new Date('2026-08-30T10:00:00.000Z'),
  isGuest: userId === null,
});

const makeGameSession = (
  overrides: Partial<GameSessionDetailModel> = {},
): GameSessionDetailModel => ({
  id: SESSION_ID,
  lobbyId: LOBBY_ID,
  scheduledAt: '2999-12-31',
  status: GameSessionStatus.scheduled,
  description: null,
  title: 'ロビーの題名',
  scenarioName: null,
  location: null,
  timeLabel: null,
  overrides: {
    title: null,
    scenarioName: null,
    location: null,
    timeLabel: null,
  },
  lobby: {
    id: LOBBY_ID,
    title: 'ロビーの題名',
    scenarioName: null,
    location: null,
    maxPlayers: null,
    hostUserId: HOST_USER_ID,
    status: LobbyStatus.open,
  },
  completedAt: null,
  cancelledAt: null,
  createdAt: new Date('2026-08-01T00:00:00.000Z'),
  updatedAt: new Date('2026-08-01T00:00:00.000Z'),
  seats: [],
  ...overrides,
});

const asUser = (id: string | null) => {
  vi.mocked(useAuthStore).mockReturnValue({
    currentUser: id ? { id } : null,
  } as unknown as ReturnType<typeof useAuthStore>);
};

const setup = (
  session: GameSessionDetailModel | null,
  userId = HOST_USER_ID,
) => {
  asUser(userId);
  const onRefresh = vi.fn();
  const composable = useGameSessionStatus(
    LOBBY_ID,
    SESSION_ID,
    ref(session),
    onRefresh,
  );
  return { ...composable, onRefresh };
};

beforeEach(() => {
  setActivePinia(createPinia());
  vi.clearAllMocks();
});

describe('isHost', () => {
  it('ロビーのホストなら true（ホストはロビーが持つ）', () => {
    // Arrange / Act
    const { isHost } = setup(makeGameSession());

    // Assert
    expect(isHost.value).toBe(true);
  });

  it('ホスト以外なら false', () => {
    // Arrange / Act
    const { isHost } = setup(makeGameSession(), OTHER_USER_ID);

    // Assert
    expect(isHost.value).toBe(false);
  });
});

describe('canComplete / canCancel', () => {
  it.each([GameSessionStatus.scheduled, GameSessionStatus.today])(
    '%s のときホストは完了も中止もできる',
    (status) => {
      // Arrange / Act
      const { canComplete, canCancel } = setup(makeGameSession({ status }));

      // Assert
      expect(canComplete.value).toBe(true);
      expect(canCancel.value).toBe(true);
    },
  );

  it.each([GameSessionStatus.completed, GameSessionStatus.cancelled])(
    '%s のときは完了も中止もできない（終端）',
    (status) => {
      // Arrange / Act
      const { canComplete, canCancel } = setup(makeGameSession({ status }));

      // Assert
      expect(canComplete.value).toBe(false);
      expect(canCancel.value).toBe(false);
    },
  );

  it('ホスト以外はできない', () => {
    // Arrange / Act
    const { canComplete, canCancel } = setup(makeGameSession(), OTHER_USER_ID);

    // Assert
    expect(canComplete.value).toBe(false);
    expect(canCancel.value).toBe(false);
  });

  it('未取得なら false', () => {
    // Arrange / Act
    const { canComplete, canCancel } = setup(null);

    // Assert
    expect(canComplete.value).toBe(false);
    expect(canCancel.value).toBe(false);
  });
});

describe('canEdit', () => {
  it.each([
    GameSessionStatus.scheduled,
    GameSessionStatus.today,
    GameSessionStatus.completed,
  ])('%s のときホストは開催を編集できる', (status) => {
    // Arrange / Act
    const { canEdit } = setup(makeGameSession({ status }));

    // Assert
    expect(canEdit.value).toBe(true);
  });

  it('中止した開催はホストでも編集できない', () => {
    // Arrange / Act
    const { canEdit } = setup(
      makeGameSession({ status: GameSessionStatus.cancelled }),
    );

    // Assert
    expect(canEdit.value).toBe(false);
  });
});

describe('canDelete', () => {
  it('中止した開催は着席者がいても削除できる', () => {
    // Arrange / Act
    const { canDelete } = setup(
      makeGameSession({
        status: GameSessionStatus.cancelled,
        seats: [makeSeat(OTHER_USER_ID)],
      }),
    );

    // Assert
    expect(canDelete.value).toBe(true);
  });

  it('中止していなくても着席者がホストだけなら削除できる', () => {
    // Arrange / Act
    // 件数条件はポリシー表で表せないのでここで足している（design-v2 §4-5）
    const { canDelete } = setup(
      makeGameSession({ seats: [makeSeat(HOST_USER_ID)] }),
    );

    // Assert
    expect(canDelete.value).toBe(true);
  });

  it('中止しておらず他の着席者がいれば削除できない', () => {
    // Arrange / Act
    const { canDelete } = setup(
      makeGameSession({
        seats: [makeSeat(HOST_USER_ID), makeSeat(OTHER_USER_ID)],
      }),
    );

    // Assert
    expect(canDelete.value).toBe(false);
  });

  it('ゲストが着席していれば削除できない', () => {
    // Arrange / Act
    const { canDelete } = setup(makeGameSession({ seats: [makeSeat(null)] }));

    // Assert
    expect(canDelete.value).toBe(false);
  });

  it('ホスト以外は削除できない', () => {
    // Arrange / Act
    const { canDelete } = setup(
      makeGameSession({ status: GameSessionStatus.cancelled }),
      OTHER_USER_ID,
    );

    // Assert
    expect(canDelete.value).toBe(false);
  });
});

describe('completeGameSession', () => {
  it('API を呼んで onRefresh を実行する', async () => {
    // Arrange
    vi.mocked(updateGameSessionStatus).mockResolvedValue(
      {} as Awaited<ReturnType<typeof updateGameSessionStatus>>,
    );
    const { completeGameSession, onRefresh } = setup(
      makeGameSession({ status: GameSessionStatus.today }),
    );

    // Act
    await completeGameSession();

    // Assert
    expect(updateGameSessionStatus).toHaveBeenCalledWith(LOBBY_ID, SESSION_ID, {
      status: 'completed',
    });
    expect(onRefresh).toHaveBeenCalled();
  });

  it('できない状態では API を呼ばない', async () => {
    // Arrange
    const { completeGameSession } = setup(
      makeGameSession({ status: GameSessionStatus.completed }),
    );

    // Act
    await completeGameSession();

    // Assert
    expect(updateGameSessionStatus).not.toHaveBeenCalled();
  });

  it('失敗すると toast.error を出す', async () => {
    // Arrange
    vi.mocked(updateGameSessionStatus).mockRejectedValue(new Error('boom'));
    const { completeGameSession, onRefresh } = setup(makeGameSession());

    // Act
    await completeGameSession();

    // Assert
    expect(mockToastError).toHaveBeenCalledWith('完了への変更に失敗しました');
    expect(onRefresh).not.toHaveBeenCalled();
  });
});

describe('cancelGameSession', () => {
  it('API を呼んで onRefresh を実行する', async () => {
    // Arrange
    vi.mocked(updateGameSessionStatus).mockResolvedValue(
      {} as Awaited<ReturnType<typeof updateGameSessionStatus>>,
    );
    const { cancelGameSession, onRefresh } = setup(makeGameSession());

    // Act
    await cancelGameSession();

    // Assert
    expect(updateGameSessionStatus).toHaveBeenCalledWith(LOBBY_ID, SESSION_ID, {
      status: 'cancelled',
    });
    expect(onRefresh).toHaveBeenCalled();
  });
});

describe('removeGameSession', () => {
  it('削除に成功するとロビー詳細へ戻る', async () => {
    // Arrange
    vi.mocked(deleteGameSession).mockResolvedValue(undefined);
    const { removeGameSession } = setup(
      makeGameSession({ status: GameSessionStatus.cancelled }),
    );

    // Act
    await removeGameSession();

    // Assert
    expect(deleteGameSession).toHaveBeenCalledWith(LOBBY_ID, SESSION_ID);
    expect(mockToastSuccess).toHaveBeenCalledWith('開催を削除しました');
    expect(mockRouterPush).toHaveBeenCalledWith({
      name: 'lobbies-detail',
      params: { lobbyId: LOBBY_ID },
    });
  });

  it('削除できない状態では API を呼ばない', async () => {
    // Arrange
    const { removeGameSession } = setup(
      makeGameSession({ seats: [makeSeat(OTHER_USER_ID)] }),
    );

    // Act
    await removeGameSession();

    // Assert
    expect(deleteGameSession).not.toHaveBeenCalled();
  });

  it('失敗すると toast.error を出し、遷移しない', async () => {
    // Arrange
    vi.mocked(deleteGameSession).mockRejectedValue(new Error('boom'));
    const { removeGameSession } = setup(
      makeGameSession({ status: GameSessionStatus.cancelled }),
    );

    // Act
    await removeGameSession();

    // Assert
    expect(mockToastError).toHaveBeenCalledWith('開催の削除に失敗しました');
    expect(mockRouterPush).not.toHaveBeenCalled();
  });
});
