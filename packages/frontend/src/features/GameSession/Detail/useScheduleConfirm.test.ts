import { describe, it, expect, vi, beforeEach } from 'vitest';
import { ref } from 'vue';
import { createPinia, setActivePinia } from 'pinia';
import { useScheduleConfirm } from '@/features/GameSession/Detail/useScheduleConfirm';
import { GameSessionStatus } from '@taku-biyori/shared';
import type { GameSessionDetail } from '@taku-biyori/shared';

vi.mock('@/api/game-session', () => ({
  confirmAvailabilityDate: vi.fn(),
}));

vi.mock('@/stores/auth', () => ({
  useAuthStore: vi.fn(),
}));

const mockToastError = vi.fn();
vi.mock('@/composables/useToast', () => ({
  useToast: () => ({ error: mockToastError }),
}));

import { confirmAvailabilityDate } from '@/api/game-session';
import { useAuthStore } from '@/stores/auth';

const HOST_USER_ID = 'host-user-id';
const OTHER_USER_ID = 'other-user-id';
const SESSION_ID = 'session-id';
const DATE_ID = 'date-id';

function makeGameSession(
  overrides: Partial<GameSessionDetail> = {},
): GameSessionDetail {
  return {
    id: SESSION_ID,
    title: 'テストセッション',
    status: GameSessionStatus.scheduling,
    isPublished: true,
    createdBy: HOST_USER_ID,
    createdAt: '2026-01-01T00:00:00Z',
    updatedAt: '2026-01-01T00:00:00Z',
    members: [],
    ...overrides,
  };
}

function setupAuthAs(userId: string) {
  vi.mocked(useAuthStore).mockReturnValue({
    currentUser: { id: userId },
  } as ReturnType<typeof useAuthStore>);
}

beforeEach(() => {
  setActivePinia(createPinia());
  vi.clearAllMocks();
});

describe('canConfirm', () => {
  it('ホストかつ status が scheduling のとき true を返す', () => {
    // Arrange
    setupAuthAs(HOST_USER_ID);
    const gameSession = ref(
      makeGameSession({ status: GameSessionStatus.scheduling }),
    );

    // Act
    const { canConfirm } = useScheduleConfirm(SESSION_ID, gameSession);

    // Assert
    expect(canConfirm.value).toBe(true);
  });

  it('ホストでも status が scheduling 以外のとき false を返す', () => {
    // Arrange
    setupAuthAs(HOST_USER_ID);
    const gameSession = ref(
      makeGameSession({ status: GameSessionStatus.confirmed }),
    );

    // Act
    const { canConfirm } = useScheduleConfirm(SESSION_ID, gameSession);

    // Assert
    expect(canConfirm.value).toBe(false);
  });

  it('ホスト以外は status が scheduling でも false を返す', () => {
    // Arrange
    setupAuthAs(OTHER_USER_ID);
    const gameSession = ref(
      makeGameSession({ status: GameSessionStatus.scheduling }),
    );

    // Act
    const { canConfirm } = useScheduleConfirm(SESSION_ID, gameSession);

    // Assert
    expect(canConfirm.value).toBe(false);
  });

  it('gameSession が null のとき false を返す', () => {
    // Arrange
    setupAuthAs(HOST_USER_ID);
    const gameSession = ref<GameSessionDetail | null>(null);

    // Act
    const { canConfirm } = useScheduleConfirm(SESSION_ID, gameSession);

    // Assert
    expect(canConfirm.value).toBe(false);
  });
});

describe('confirmDate', () => {
  it('confirmAvailabilityDate を正しい引数で呼び出す', async () => {
    // Arrange
    setupAuthAs(HOST_USER_ID);
    vi.mocked(confirmAvailabilityDate).mockResolvedValue({
      id: SESSION_ID,
      title: 'テストセッション',
      status: GameSessionStatus.confirmed,
      isPublished: true,
      scheduledAt: '2026-06-30',
      createdBy: HOST_USER_ID,
      createdAt: '2026-01-01T00:00:00Z',
      updatedAt: '2026-01-01T00:00:00Z',
    });
    const gameSession = ref(makeGameSession());
    const { confirmDate } = useScheduleConfirm(SESSION_ID, gameSession);

    // Act
    await confirmDate(DATE_ID);

    // Assert
    expect(confirmAvailabilityDate).toHaveBeenCalledWith(SESSION_ID, DATE_ID);
  });

  it('成功後に gameSession の status と scheduledAt が更新される', async () => {
    // Arrange
    setupAuthAs(HOST_USER_ID);
    const updatedScheduledAt = '2026-06-30';
    vi.mocked(confirmAvailabilityDate).mockResolvedValue({
      id: SESSION_ID,
      title: 'テストセッション',
      status: GameSessionStatus.confirmed,
      isPublished: true,
      scheduledAt: updatedScheduledAt,
      createdBy: HOST_USER_ID,
      createdAt: '2026-01-01T00:00:00Z',
      updatedAt: '2026-01-01T00:00:00Z',
    });
    const gameSession = ref(makeGameSession());
    const { confirmDate } = useScheduleConfirm(SESSION_ID, gameSession);

    // Act
    await confirmDate(DATE_ID);

    // Assert
    expect(gameSession.value?.status).toBe(GameSessionStatus.confirmed);
    expect(gameSession.value?.scheduledAt).toBe(updatedScheduledAt);
  });

  it('成功後に loading が false に戻る', async () => {
    // Arrange
    setupAuthAs(HOST_USER_ID);
    vi.mocked(confirmAvailabilityDate).mockResolvedValue({
      id: SESSION_ID,
      title: 'テストセッション',
      status: GameSessionStatus.confirmed,
      isPublished: true,
      scheduledAt: '2026-06-30',
      createdBy: HOST_USER_ID,
      createdAt: '2026-01-01T00:00:00Z',
      updatedAt: '2026-01-01T00:00:00Z',
    });
    const gameSession = ref(makeGameSession());
    const { confirmDate, loading } = useScheduleConfirm(
      SESSION_ID,
      gameSession,
    );

    // Act
    await confirmDate(DATE_ID);

    // Assert
    expect(loading.value).toBe(false);
  });

  it('API エラー時に toast.error が呼ばれる', async () => {
    // Arrange
    setupAuthAs(HOST_USER_ID);
    vi.mocked(confirmAvailabilityDate).mockRejectedValue(
      new Error('サーバーエラー'),
    );
    const gameSession = ref(makeGameSession());
    const { confirmDate } = useScheduleConfirm(SESSION_ID, gameSession);

    // Act
    await confirmDate(DATE_ID);

    // Assert
    expect(mockToastError).toHaveBeenCalledWith('日程の確定に失敗しました');
  });

  it('API エラー時に loading が false に戻る', async () => {
    // Arrange
    setupAuthAs(HOST_USER_ID);
    vi.mocked(confirmAvailabilityDate).mockRejectedValue(
      new Error('サーバーエラー'),
    );
    const gameSession = ref(makeGameSession());
    const { confirmDate, loading } = useScheduleConfirm(
      SESSION_ID,
      gameSession,
    );

    // Act
    await confirmDate(DATE_ID);

    // Assert
    expect(loading.value).toBe(false);
  });

  it('loading 中に呼び出しても重複しない', async () => {
    // Arrange
    setupAuthAs(HOST_USER_ID);
    let resolve!: () => void;
    vi.mocked(confirmAvailabilityDate).mockReturnValue(
      new Promise<never>((r) => {
        resolve = r as () => void;
      }),
    );
    const gameSession = ref(makeGameSession());
    const { confirmDate } = useScheduleConfirm(SESSION_ID, gameSession);

    // Act
    const first = confirmDate(DATE_ID);
    await confirmDate(DATE_ID);
    resolve();
    await first;

    // Assert
    expect(confirmAvailabilityDate).toHaveBeenCalledTimes(1);
  });
});
