import { describe, it, expect, vi, beforeEach } from 'vitest';
import { createPinia, setActivePinia } from 'pinia';
import { useScheduleConfirm } from '@/features/GameSession/Detail/Schedule/useScheduleConfirm';
import { GameSessionStatus } from '@taku-biyori/shared';

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

function setupAuthAs(userId: string) {
  vi.mocked(useAuthStore).mockReturnValue({
    currentUser: { id: userId },
  } as ReturnType<typeof useAuthStore>);
}

function makeUpdatedSession() {
  return {
    id: SESSION_ID,
    title: 'テストセッション',
    status: GameSessionStatus.confirmed,
    isPublished: true,
    scheduledAt: '2026-06-30',
    createdBy: HOST_USER_ID,
    createdAt: '2026-01-01T00:00:00Z',
    updatedAt: '2026-01-01T00:00:00Z',
  };
}

beforeEach(() => {
  setActivePinia(createPinia());
  vi.clearAllMocks();
});

describe('canConfirm', () => {
  it('ホストかつ status が scheduling のとき true を返す', () => {
    // Arrange
    setupAuthAs(HOST_USER_ID);

    // Act
    const { canConfirm } = useScheduleConfirm(
      SESSION_ID,
      HOST_USER_ID,
      GameSessionStatus.scheduling,
      vi.fn(),
    );

    // Assert
    expect(canConfirm.value).toBe(true);
  });

  it('ホストでも status が scheduling 以外のとき false を返す', () => {
    // Arrange
    setupAuthAs(HOST_USER_ID);

    // Act
    const { canConfirm } = useScheduleConfirm(
      SESSION_ID,
      HOST_USER_ID,
      GameSessionStatus.confirmed,
      vi.fn(),
    );

    // Assert
    expect(canConfirm.value).toBe(false);
  });

  it('ホスト以外は status が scheduling でも false を返す', () => {
    // Arrange
    setupAuthAs(OTHER_USER_ID);

    // Act
    const { canConfirm } = useScheduleConfirm(
      SESSION_ID,
      HOST_USER_ID,
      GameSessionStatus.scheduling,
      vi.fn(),
    );

    // Assert
    expect(canConfirm.value).toBe(false);
  });
});

describe('confirmDate', () => {
  it('confirmAvailabilityDate を正しい引数で呼び出す', async () => {
    // Arrange
    setupAuthAs(HOST_USER_ID);
    vi.mocked(confirmAvailabilityDate).mockResolvedValue(makeUpdatedSession());
    const { confirmDate } = useScheduleConfirm(
      SESSION_ID,
      HOST_USER_ID,
      GameSessionStatus.scheduling,
      vi.fn(),
    );

    // Act
    await confirmDate(DATE_ID);

    // Assert
    expect(confirmAvailabilityDate).toHaveBeenCalledWith(SESSION_ID, DATE_ID);
  });

  it('成功後に onConfirmed コールバックが更新データで呼ばれる', async () => {
    // Arrange
    setupAuthAs(HOST_USER_ID);
    const updated = makeUpdatedSession();
    vi.mocked(confirmAvailabilityDate).mockResolvedValue(updated);
    const onConfirmed = vi.fn();
    const { confirmDate } = useScheduleConfirm(
      SESSION_ID,
      HOST_USER_ID,
      GameSessionStatus.scheduling,
      onConfirmed,
    );

    // Act
    await confirmDate(DATE_ID);

    // Assert
    expect(onConfirmed).toHaveBeenCalledWith(updated);
  });

  it('成功後に loading が false に戻る', async () => {
    // Arrange
    setupAuthAs(HOST_USER_ID);
    vi.mocked(confirmAvailabilityDate).mockResolvedValue(makeUpdatedSession());
    const { confirmDate, loading } = useScheduleConfirm(
      SESSION_ID,
      HOST_USER_ID,
      GameSessionStatus.scheduling,
      vi.fn(),
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
    const { confirmDate } = useScheduleConfirm(
      SESSION_ID,
      HOST_USER_ID,
      GameSessionStatus.scheduling,
      vi.fn(),
    );

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
    const { confirmDate, loading } = useScheduleConfirm(
      SESSION_ID,
      HOST_USER_ID,
      GameSessionStatus.scheduling,
      vi.fn(),
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
    const { confirmDate } = useScheduleConfirm(
      SESSION_ID,
      HOST_USER_ID,
      GameSessionStatus.scheduling,
      vi.fn(),
    );

    // Act
    const first = confirmDate(DATE_ID);
    await confirmDate(DATE_ID);
    resolve();
    await first;

    // Assert
    expect(confirmAvailabilityDate).toHaveBeenCalledTimes(1);
  });
});
