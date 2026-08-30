import { beforeEach, describe, expect, it, vi } from 'vitest';
import { createPinia, setActivePinia } from 'pinia';
import { nextTick, ref } from 'vue';
import {
  LOBBY_CANDIDATE_DATES_MAX_COUNT,
  LobbyStatus,
} from '@taku-biyori/shared';
import { useCandidateDateEdit } from '@/features/Lobby/Detail/Schedule/useCandidateDateEdit';
import { ApiError } from '@/lib/api-client';
import type { CandidateDateModel } from '@/models/schedule-poll';

vi.mock('@/api/lobby', () => ({
  replaceCandidateDates: vi.fn(),
}));

vi.mock('@/stores/auth', () => ({
  useAuthStore: vi.fn(),
}));

import { replaceCandidateDates } from '@/api/lobby';
import { useAuthStore } from '@/stores/auth';

const LOBBY_ID = 'lobby-1';
const POLL_ID = 'poll-1';
const HOST_USER_ID = 'host-user-id';
const OTHER_USER_ID = 'other-user-id';

function setupAuthAs(userId: string) {
  vi.mocked(useAuthStore).mockReturnValue({
    currentUser: { id: userId },
  } as ReturnType<typeof useAuthStore>);
}

function makeCandidateDates(): CandidateDateModel[] {
  return [
    {
      id: 'date-1',
      date: '2026-08-01',
      timeLabel: '19:00〜',
      answersByEntryId: new Map(),
    },
    {
      id: 'date-2',
      date: '2026-08-02',
      timeLabel: null,
      answersByEntryId: new Map(),
    },
  ];
}

beforeEach(() => {
  setActivePinia(createPinia());
  vi.clearAllMocks();
  setupAuthAs(HOST_USER_ID);
});

describe('canEditCandidateDates', () => {
  it.each([
    [LobbyStatus.draft, true],
    [LobbyStatus.open, true],
    [LobbyStatus.closed, true],
    [LobbyStatus.disbanded, false],
    [undefined, false],
  ])('status が %s のとき %s', (status, expected) => {
    // Act
    const { canEditCandidateDates } = useCandidateDateEdit(
      LOBBY_ID,
      () => POLL_ID,
      () => HOST_USER_ID,
      () => status,
      () => makeCandidateDates(),
      vi.fn(),
      vi.fn(),
    );

    // Assert
    expect(canEditCandidateDates.value).toBe(expected);
  });

  it('ホスト以外は status が open でも false を返す', () => {
    // Arrange
    setupAuthAs(OTHER_USER_ID);

    // Act
    const { canEditCandidateDates } = useCandidateDateEdit(
      LOBBY_ID,
      () => POLL_ID,
      () => HOST_USER_ID,
      () => LobbyStatus.open,
      () => makeCandidateDates(),
      vi.fn(),
      vi.fn(),
    );

    // Assert
    expect(canEditCandidateDates.value).toBe(false);
  });
});

describe('enterEditMode', () => {
  it('サーバ値（candidateDates）を pendingDates にコピーする', () => {
    // Arrange
    const { enterEditMode, pendingDates } = useCandidateDateEdit(
      LOBBY_ID,
      () => POLL_ID,
      () => HOST_USER_ID,
      () => LobbyStatus.open,
      () => makeCandidateDates(),
      vi.fn(),
      vi.fn(),
    );

    // Act
    enterEditMode();

    // Assert
    expect(pendingDates.value).toEqual([
      { date: '2026-08-01', timeLabel: '19:00〜' },
      { date: '2026-08-02', timeLabel: '' },
    ]);
  });

  it('isEditing を true にする', () => {
    // Arrange
    const { enterEditMode, isEditing } = useCandidateDateEdit(
      LOBBY_ID,
      () => POLL_ID,
      () => HOST_USER_ID,
      () => LobbyStatus.open,
      () => makeCandidateDates(),
      vi.fn(),
      vi.fn(),
    );

    // Act
    enterEditMode();

    // Assert
    expect(isEditing.value).toBe(true);
  });
});

describe('cancelEdit', () => {
  it('isEditing を false にし pendingDates を破棄する', () => {
    // Arrange
    const { enterEditMode, cancelEdit, isEditing, pendingDates } =
      useCandidateDateEdit(
        LOBBY_ID,
        () => POLL_ID,
        () => HOST_USER_ID,
        () => LobbyStatus.open,
        () => makeCandidateDates(),
        vi.fn(),
        vi.fn(),
      );
    enterEditMode();

    // Act
    cancelEdit();

    // Assert
    expect(isEditing.value).toBe(false);
    expect(pendingDates.value).toEqual([]);
  });
});

describe('サーバ値の更新', () => {
  it('編集中に pollId が変わったら編集を終了してドラフトを破棄する', async () => {
    // Arrange
    const pollId = ref(POLL_ID);
    const candidateDates = ref(makeCandidateDates());
    const { enterEditMode, isEditing, pendingDates } = useCandidateDateEdit(
      LOBBY_ID,
      pollId,
      () => HOST_USER_ID,
      () => LobbyStatus.open,
      candidateDates,
      vi.fn(),
      vi.fn(),
    );
    enterEditMode();
    pendingDates.value[0]!.timeLabel = '変更中';

    // Act
    pollId.value = 'poll-2';
    candidateDates.value = [
      {
        id: 'date-3',
        date: '2026-09-01',
        timeLabel: null,
        answersByEntryId: new Map(),
      },
    ];
    await nextTick();

    // Assert
    expect(isEditing.value).toBe(false);
    expect(pendingDates.value).toEqual([]);
  });
});

describe('submitEdit', () => {
  it('候補日が1件も無ければ API を呼ばずエラーを設定する', async () => {
    // Arrange
    const { enterEditMode, pendingDates, submitEdit, errorMessages } =
      useCandidateDateEdit(
        LOBBY_ID,
        () => POLL_ID,
        () => HOST_USER_ID,
        () => LobbyStatus.open,
        () => makeCandidateDates(),
        vi.fn(),
        vi.fn(),
      );
    enterEditMode();
    pendingDates.value = [];

    // Act
    await submitEdit();

    // Assert
    expect(replaceCandidateDates).not.toHaveBeenCalled();
    expect(errorMessages.value).toEqual(['候補日を1件以上指定してください']);
  });

  it('候補日が上限を超えると API を呼ばずエラーを設定する', async () => {
    // Arrange
    const { enterEditMode, pendingDates, submitEdit, errorMessages } =
      useCandidateDateEdit(
        LOBBY_ID,
        () => POLL_ID,
        () => HOST_USER_ID,
        () => LobbyStatus.open,
        () => makeCandidateDates(),
        vi.fn(),
        vi.fn(),
      );
    enterEditMode();
    pendingDates.value = Array.from(
      { length: LOBBY_CANDIDATE_DATES_MAX_COUNT + 1 },
      (_, index) => ({
        date: `2026-10-${String(index + 1).padStart(2, '0')}`,
        timeLabel: '',
      }),
    );

    // Act
    await submitEdit();

    // Assert
    expect(replaceCandidateDates).not.toHaveBeenCalled();
    expect(errorMessages.value).toEqual([
      `候補日は${LOBBY_CANDIDATE_DATES_MAX_COUNT}件以下で指定してください`,
    ]);
  });

  it('pendingDates を API の入力形式に変換して送信する', async () => {
    // Arrange
    vi.mocked(replaceCandidateDates).mockResolvedValue([]);
    const { enterEditMode, submitEdit } = useCandidateDateEdit(
      LOBBY_ID,
      () => POLL_ID,
      () => HOST_USER_ID,
      () => LobbyStatus.open,
      () => makeCandidateDates(),
      vi.fn(),
      vi.fn(),
    );
    enterEditMode();

    // Act
    await submitEdit();

    // Assert
    expect(replaceCandidateDates).toHaveBeenCalledWith(LOBBY_ID, POLL_ID, {
      candidateDates: [
        { date: '2026-08-01', timeLabel: '19:00〜' },
        { date: '2026-08-02', timeLabel: null },
      ],
    });
  });

  it('成功したら onUpdated を呼び、isEditing を false にする', async () => {
    // Arrange
    vi.mocked(replaceCandidateDates).mockResolvedValue([]);
    const onUpdated = vi.fn();
    const { enterEditMode, submitEdit, isEditing } = useCandidateDateEdit(
      LOBBY_ID,
      () => POLL_ID,
      () => HOST_USER_ID,
      () => LobbyStatus.open,
      () => makeCandidateDates(),
      onUpdated,
      vi.fn(),
    );
    enterEditMode();

    // Act
    await submitEdit();

    // Assert
    expect(onUpdated).toHaveBeenCalledTimes(1);
    expect(isEditing.value).toBe(false);
  });

  it('409 のとき errorMessages を設定し onStale を呼ぶ（onUpdated は呼ばない）', async () => {
    // Arrange
    vi.mocked(replaceCandidateDates).mockRejectedValue(
      new ApiError(409, 'Not the latest schedule poll'),
    );
    const onUpdated = vi.fn();
    const onStale = vi.fn();
    const { enterEditMode, submitEdit, errorMessages, isEditing } =
      useCandidateDateEdit(
        LOBBY_ID,
        () => POLL_ID,
        () => HOST_USER_ID,
        () => LobbyStatus.open,
        () => makeCandidateDates(),
        onUpdated,
        onStale,
      );
    enterEditMode();

    // Act
    await submitEdit();

    // Assert
    expect(errorMessages.value).toEqual([
      '新しい日程調整が始まっています。最新の状態を読み込み直してください',
    ]);
    expect(onStale).toHaveBeenCalledTimes(1);
    expect(onUpdated).not.toHaveBeenCalled();
    expect(isEditing.value).toBe(false);
  });

  it('400 のとき過去日追加を伝えるエラーを設定する', async () => {
    // Arrange
    vi.mocked(replaceCandidateDates).mockRejectedValue(
      new ApiError(
        400,
        'Cannot add a past date that is not already in this poll',
      ),
    );
    const { enterEditMode, submitEdit, errorMessages } = useCandidateDateEdit(
      LOBBY_ID,
      () => POLL_ID,
      () => HOST_USER_ID,
      () => LobbyStatus.open,
      () => makeCandidateDates(),
      vi.fn(),
      vi.fn(),
    );
    enterEditMode();

    // Act
    await submitEdit();

    // Assert
    expect(errorMessages.value).toEqual([
      '現在の調整に含まれていない過去日を追加することはできません',
    ]);
  });

  it('その他のエラーのとき ApiError のメッセージを設定する', async () => {
    // Arrange
    vi.mocked(replaceCandidateDates).mockRejectedValue(
      new ApiError(403, '権限がありません'),
    );
    const { enterEditMode, submitEdit, errorMessages } = useCandidateDateEdit(
      LOBBY_ID,
      () => POLL_ID,
      () => HOST_USER_ID,
      () => LobbyStatus.open,
      () => makeCandidateDates(),
      vi.fn(),
      vi.fn(),
    );
    enterEditMode();

    // Act
    await submitEdit();

    // Assert
    expect(errorMessages.value).toEqual(['権限がありません']);
  });

  it('pollId が null のときは API を呼ばない', async () => {
    // Arrange
    const { enterEditMode, submitEdit } = useCandidateDateEdit(
      LOBBY_ID,
      () => null,
      () => HOST_USER_ID,
      () => LobbyStatus.open,
      () => makeCandidateDates(),
      vi.fn(),
      vi.fn(),
    );
    enterEditMode();

    // Act
    await submitEdit();

    // Assert
    expect(replaceCandidateDates).not.toHaveBeenCalled();
  });

  it('loading 中の重複呼び出しは無視する', async () => {
    // Arrange
    let resolve!: (v: CandidateDateModel[]) => void;
    vi.mocked(replaceCandidateDates).mockReturnValue(
      new Promise((r) => {
        resolve = r;
      }),
    );
    const { enterEditMode, submitEdit } = useCandidateDateEdit(
      LOBBY_ID,
      () => POLL_ID,
      () => HOST_USER_ID,
      () => LobbyStatus.open,
      () => makeCandidateDates(),
      vi.fn(),
      vi.fn(),
    );
    enterEditMode();

    // Act
    const first = submitEdit();
    await submitEdit();
    resolve([]);
    await first;

    // Assert
    expect(replaceCandidateDates).toHaveBeenCalledTimes(1);
  });
});
