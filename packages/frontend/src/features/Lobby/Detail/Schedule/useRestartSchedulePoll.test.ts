import { beforeEach, describe, expect, it, vi } from 'vitest';
import { createPinia, setActivePinia } from 'pinia';
import { LobbyStatus, todayDateString } from '@taku-biyori/shared';
import { useRestartSchedulePoll } from '@/features/Lobby/Detail/Schedule/useRestartSchedulePoll';
import { ApiError } from '@/lib/api-client';
import type { SchedulePollModel } from '@/models/schedule-poll';

vi.mock('@/api/lobby', () => ({
  createSchedulePoll: vi.fn(),
}));

vi.mock('@/stores/auth', () => ({
  useAuthStore: vi.fn(),
}));

import { createSchedulePoll } from '@/api/lobby';
import { useAuthStore } from '@/stores/auth';

const LOBBY_ID = 'lobby-1';
const HOST_USER_ID = 'host-user-id';
const OTHER_USER_ID = 'other-user-id';

function setupAuthAs(userId: string) {
  vi.mocked(useAuthStore).mockReturnValue({
    currentUser: { id: userId },
  } as ReturnType<typeof useAuthStore>);
}

function makePoll(): SchedulePollModel {
  return {
    id: 'poll-2',
    lobbyId: LOBBY_ID,
    createdAt: new Date('2026-07-01T00:00:00Z'),
    candidateDates: [],
  };
}

beforeEach(() => {
  setActivePinia(createPinia());
  vi.clearAllMocks();
  setupAuthAs(HOST_USER_ID);
});

describe('canRestart', () => {
  it.each([
    [LobbyStatus.draft, true],
    [LobbyStatus.open, true],
    [LobbyStatus.closed, true],
    [LobbyStatus.disbanded, false],
    [undefined, false],
  ])('status が %s のとき %s', (status, expected) => {
    // Act
    const { canRestart } = useRestartSchedulePoll(
      LOBBY_ID,
      () => HOST_USER_ID,
      () => status,
      vi.fn(),
    );

    // Assert
    expect(canRestart.value).toBe(expected);
  });

  it('ホスト以外は status が open でも false を返す', () => {
    // Arrange
    setupAuthAs(OTHER_USER_ID);

    // Act
    const { canRestart } = useRestartSchedulePoll(
      LOBBY_ID,
      () => HOST_USER_ID,
      () => LobbyStatus.open,
      vi.fn(),
    );

    // Assert
    expect(canRestart.value).toBe(false);
  });
});

describe('start / cancel', () => {
  it('start で isConfirming を true にし、pendingDates とエラーを初期化する', () => {
    // Arrange
    const { start, isConfirming, pendingDates, errorMessages } =
      useRestartSchedulePoll(
        LOBBY_ID,
        () => HOST_USER_ID,
        () => LobbyStatus.open,
        vi.fn(),
      );

    // Act
    start();

    // Assert
    expect(isConfirming.value).toBe(true);
    expect(pendingDates.value).toEqual([]);
    expect(errorMessages.value).toEqual([]);
  });

  it('cancel で isConfirming を false に戻し、pendingDates を破棄する', () => {
    // Arrange
    const { start, cancel, isConfirming, pendingDates } =
      useRestartSchedulePoll(
        LOBBY_ID,
        () => HOST_USER_ID,
        () => LobbyStatus.open,
        vi.fn(),
      );
    start();
    pendingDates.value = [{ date: '2099-01-01', timeLabel: '' }];

    // Act
    cancel();

    // Assert
    expect(isConfirming.value).toBe(false);
    expect(pendingDates.value).toEqual([]);
  });
});

describe('confirmRestart', () => {
  it('候補日が1件も無ければ API を呼ばずエラーを設定する', async () => {
    // Arrange
    const { start, confirmRestart, errorMessages } = useRestartSchedulePoll(
      LOBBY_ID,
      () => HOST_USER_ID,
      () => LobbyStatus.open,
      vi.fn(),
    );
    start();

    // Act
    await confirmRestart();

    // Assert
    expect(createSchedulePoll).not.toHaveBeenCalled();
    expect(errorMessages.value).toEqual(['候補日を1件以上指定してください']);
  });

  it('過去日を含む場合は API を呼ばずエラーを設定する', async () => {
    // Arrange
    const { start, pendingDates, confirmRestart, errorMessages } =
      useRestartSchedulePoll(
        LOBBY_ID,
        () => HOST_USER_ID,
        () => LobbyStatus.open,
        vi.fn(),
      );
    start();
    pendingDates.value = [{ date: '2000-01-01', timeLabel: '' }];

    // Act
    await confirmRestart();

    // Assert
    expect(createSchedulePoll).not.toHaveBeenCalled();
    expect(errorMessages.value).toEqual([
      '候補日には今日以降の日付を指定してください',
    ]);
  });

  it('妥当な候補日で createSchedulePoll を呼ぶ', async () => {
    // Arrange
    vi.mocked(createSchedulePoll).mockResolvedValue(makePoll());
    const { start, pendingDates, confirmRestart } = useRestartSchedulePoll(
      LOBBY_ID,
      () => HOST_USER_ID,
      () => LobbyStatus.open,
      vi.fn(),
    );
    start();
    const future = todayDateString();
    pendingDates.value = [{ date: future, timeLabel: '19:00〜' }];

    // Act
    await confirmRestart();

    // Assert
    expect(createSchedulePoll).toHaveBeenCalledWith(LOBBY_ID, {
      candidateDates: [{ date: future, timeLabel: '19:00〜' }],
    });
  });

  it('成功したら onCreated を呼び、isConfirming を閉じる', async () => {
    // Arrange
    vi.mocked(createSchedulePoll).mockResolvedValue(makePoll());
    const onCreated = vi.fn();
    const { start, pendingDates, confirmRestart, isConfirming } =
      useRestartSchedulePoll(
        LOBBY_ID,
        () => HOST_USER_ID,
        () => LobbyStatus.open,
        onCreated,
      );
    start();
    pendingDates.value = [{ date: todayDateString(), timeLabel: '' }];

    // Act
    await confirmRestart();

    // Assert
    expect(onCreated).toHaveBeenCalledTimes(1);
    expect(isConfirming.value).toBe(false);
  });

  it('失敗したら errorMessages を設定し onCreated を呼ばない', async () => {
    // Arrange
    vi.mocked(createSchedulePoll).mockRejectedValue(
      new ApiError(422, 'この状態では開始できません'),
    );
    const onCreated = vi.fn();
    const { start, pendingDates, confirmRestart, errorMessages } =
      useRestartSchedulePoll(
        LOBBY_ID,
        () => HOST_USER_ID,
        () => LobbyStatus.open,
        onCreated,
      );
    start();
    pendingDates.value = [{ date: todayDateString(), timeLabel: '' }];

    // Act
    await confirmRestart();

    // Assert
    expect(errorMessages.value).toEqual(['この状態では開始できません']);
    expect(onCreated).not.toHaveBeenCalled();
  });

  it('canRestart が false のときは API を呼ばない', async () => {
    // Arrange
    const { start, pendingDates, confirmRestart } = useRestartSchedulePoll(
      LOBBY_ID,
      () => HOST_USER_ID,
      () => LobbyStatus.disbanded,
      vi.fn(),
    );
    start();
    pendingDates.value = [{ date: todayDateString(), timeLabel: '' }];

    // Act
    await confirmRestart();

    // Assert
    expect(createSchedulePoll).not.toHaveBeenCalled();
  });

  it('loading 中の重複呼び出しは無視する', async () => {
    // Arrange
    let resolve!: (v: SchedulePollModel) => void;
    vi.mocked(createSchedulePoll).mockReturnValue(
      new Promise((r) => {
        resolve = r;
      }),
    );
    const { start, pendingDates, confirmRestart } = useRestartSchedulePoll(
      LOBBY_ID,
      () => HOST_USER_ID,
      () => LobbyStatus.open,
      vi.fn(),
    );
    start();
    pendingDates.value = [{ date: todayDateString(), timeLabel: '' }];

    // Act
    const first = confirmRestart();
    await confirmRestart();
    resolve(makePoll());
    await first;

    // Assert
    expect(createSchedulePoll).toHaveBeenCalledTimes(1);
  });
});
