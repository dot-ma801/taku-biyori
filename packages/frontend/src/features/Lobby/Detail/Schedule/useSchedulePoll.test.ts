import { describe, it, expect, vi, beforeEach } from 'vitest';
import { ref } from 'vue';
import { flushPromises } from '@vue/test-utils';
import { useSchedulePoll } from '@/features/Lobby/Detail/Schedule/useSchedulePoll';
import { LobbyStatus } from '@taku-biyori/shared';
import { ApiError } from '@/lib/api-client';
import type { SchedulePollModel } from '@/models/schedule-poll';

vi.mock('@/api/lobby', () => ({
  getSchedulePoll: vi.fn(),
  upsertScheduleAnswers: vi.fn(),
}));

import { getSchedulePoll, upsertScheduleAnswers } from '@/api/lobby';

const LOBBY_ID = 'lobby-1';
const POLL_ID = 'poll-1';
const MY_ENTRY_ID = 'entry-me';
const OTHER_ENTRY_ID = 'entry-other';
const DATE_ID_1 = 'date-1';
const DATE_ID_2 = 'date-2';

function makePoll(): SchedulePollModel {
  return {
    id: POLL_ID,
    lobbyId: LOBBY_ID,
    createdAt: new Date('2026-07-01T00:00:00Z'),
    candidateDates: [
      {
        id: DATE_ID_1,
        date: '2026-07-01',
        timeLabel: null,
        answersByEntryId: new Map([
          [
            MY_ENTRY_ID,
            { id: 'ans-1', entryId: MY_ENTRY_ID, answer: 'ok', comment: null },
          ],
          [
            OTHER_ENTRY_ID,
            {
              id: 'ans-2',
              entryId: OTHER_ENTRY_ID,
              answer: 'ng',
              comment: null,
            },
          ],
        ]),
      },
      {
        id: DATE_ID_2,
        date: '2026-07-02',
        timeLabel: null,
        answersByEntryId: new Map(),
      },
    ],
  };
}

// 初期ロード済みの状態にした composable を返すヘルパー
// NOTE: status はデフォルト引数にすると「明示的に undefined を渡した」ケースと
// 「省略した」ケースを JS が区別できず、常にデフォルト値へ差し替わってしまう。
// そのため arguments.length で「渡されたかどうか」を判定する（旧 useSchedule.test.ts を踏襲）。
async function setupLoaded(
  pollId: string | null = POLL_ID,
  myEntryId: string | null = MY_ENTRY_ID,
  status?: LobbyStatus,
  onStale: () => void = vi.fn(),
) {
  const resolvedStatus = arguments.length >= 3 ? status : LobbyStatus.open;
  vi.mocked(getSchedulePoll).mockResolvedValue(makePoll());
  const schedulePoll = useSchedulePoll(
    LOBBY_ID,
    () => pollId,
    () => myEntryId,
    () => resolvedStatus,
    onStale,
  );
  await flushPromises();
  return schedulePoll;
}

beforeEach(() => {
  vi.clearAllMocks();
});

describe('初期取得', () => {
  it('latestPollId があれば候補日を取得して poll に格納する', async () => {
    // Act
    const { poll, candidateDates } = await setupLoaded();

    // Assert
    expect(getSchedulePoll).toHaveBeenCalledWith(LOBBY_ID, POLL_ID);
    expect(poll.value).toEqual(makePoll());
    expect(candidateDates.value).toEqual(makePoll().candidateDates);
  });

  it('latestPollId が null の間は取得しない', async () => {
    // Act
    const { poll, loading, candidateDates } = await setupLoaded(null);

    // Assert
    expect(getSchedulePoll).not.toHaveBeenCalled();
    expect(poll.value).toBeNull();
    expect(candidateDates.value).toEqual([]);
    expect(loading.value).toBe(false);
  });

  it('latestPollId が null から値に変わったら取得する', async () => {
    // Arrange
    const pollId = ref<string | null>(null);
    vi.mocked(getSchedulePoll).mockResolvedValue(makePoll());
    const { poll } = useSchedulePoll(
      LOBBY_ID,
      () => pollId.value,
      () => MY_ENTRY_ID,
      () => LobbyStatus.open,
      vi.fn(),
    );
    await flushPromises();
    expect(getSchedulePoll).not.toHaveBeenCalled();

    // Act
    pollId.value = POLL_ID;
    await flushPromises();

    // Assert
    expect(getSchedulePoll).toHaveBeenCalledWith(LOBBY_ID, POLL_ID);
    expect(poll.value).toEqual(makePoll());
  });

  it('取得に失敗したとき errorMessage を設定する', async () => {
    // Arrange
    vi.mocked(getSchedulePoll).mockRejectedValue(new Error('ng'));

    // Act
    const { errorMessage } = useSchedulePoll(
      LOBBY_ID,
      () => POLL_ID,
      () => MY_ENTRY_ID,
      () => LobbyStatus.open,
      vi.fn(),
    );
    await flushPromises();

    // Assert
    expect(errorMessage.value).toBe('日程調整の取得に失敗しました');
  });
});

describe('refetch', () => {
  it('現在の latestPollId で再取得する', async () => {
    // Arrange
    const { refetch } = await setupLoaded();
    vi.mocked(getSchedulePoll).mockClear();

    // Act
    await refetch();

    // Assert
    expect(getSchedulePoll).toHaveBeenCalledWith(LOBBY_ID, POLL_ID);
  });

  it('latestPollId が null のときは何もしない', async () => {
    // Arrange
    const { refetch } = await setupLoaded(null);

    // Act
    await refetch();

    // Assert
    expect(getSchedulePoll).not.toHaveBeenCalled();
  });
});

describe('canInputSchedule', () => {
  it.each([
    [LobbyStatus.open, true],
    [LobbyStatus.closed, true],
    [LobbyStatus.draft, false],
    [LobbyStatus.disbanded, false],
    [undefined, false],
  ])('status が %s のとき %s', async (status, expected) => {
    // Arrange
    const { canInputSchedule } = await setupLoaded(
      POLL_ID,
      MY_ENTRY_ID,
      status,
    );

    // Assert
    expect(canInputSchedule.value).toBe(expected);
  });
});

describe('enterEditMode', () => {
  it('originalAnswers（candidateDates の answersByEntryId 由来）を draftAnswers にコピーする', async () => {
    // Arrange
    const { enterEditMode, draftAnswers } = await setupLoaded();

    // Act
    enterEditMode();

    // Assert
    expect(draftAnswers.value.get(DATE_ID_1)).toBe('ok');
  });

  it('isEditing を true にする', async () => {
    // Arrange
    const { enterEditMode, isEditing } = await setupLoaded();

    // Act
    enterEditMode();

    // Assert
    expect(isEditing.value).toBe(true);
  });

  it('myEntryId が null のときは originalAnswers が空になる', async () => {
    // Arrange
    const { enterEditMode, draftAnswers } = await setupLoaded(POLL_ID, null);

    // Act
    enterEditMode();

    // Assert
    expect(draftAnswers.value.size).toBe(0);
  });
});

describe('cycleAnswer', () => {
  it('未回答の候補日は ok から始まる', async () => {
    // Arrange
    const { enterEditMode, cycleAnswer, draftAnswers } = await setupLoaded();
    enterEditMode();

    // Act
    cycleAnswer(DATE_ID_2);

    // Assert
    expect(draftAnswers.value.get(DATE_ID_2)).toBe('ok');
  });

  it('ok -> maybe -> ng -> ok の順に循環する', async () => {
    // Arrange
    const { enterEditMode, cycleAnswer, draftAnswers } = await setupLoaded();
    enterEditMode();

    // Act & Assert
    cycleAnswer(DATE_ID_1);
    expect(draftAnswers.value.get(DATE_ID_1)).toBe('maybe');
    cycleAnswer(DATE_ID_1);
    expect(draftAnswers.value.get(DATE_ID_1)).toBe('ng');
    cycleAnswer(DATE_ID_1);
    expect(draftAnswers.value.get(DATE_ID_1)).toBe('ok');
  });
});

describe('hasChanges', () => {
  it('ドラフトが original と異なれば true', async () => {
    // Arrange
    const { enterEditMode, cycleAnswer, hasChanges } = await setupLoaded();
    enterEditMode();

    // Act
    cycleAnswer(DATE_ID_1);

    // Assert
    expect(hasChanges.value).toBe(true);
  });

  it('ドラフトが original と同じなら false', async () => {
    // Arrange
    const { enterEditMode, hasChanges } = await setupLoaded();

    // Act
    enterEditMode();

    // Assert
    expect(hasChanges.value).toBe(false);
  });
});

describe('cancelEdit', () => {
  it('isEditing を false にし draftAnswers をクリアする', async () => {
    // Arrange
    const { enterEditMode, cycleAnswer, cancelEdit, isEditing, draftAnswers } =
      await setupLoaded();
    enterEditMode();
    cycleAnswer(DATE_ID_1);

    // Act
    cancelEdit();

    // Assert
    expect(isEditing.value).toBe(false);
    expect(draftAnswers.value.size).toBe(0);
  });
});

describe('submitEdit', () => {
  it('original と異なる差分のみを1リクエストにまとめて送信する', async () => {
    // Arrange
    vi.mocked(upsertScheduleAnswers).mockResolvedValue([]);
    const { enterEditMode, cycleAnswer, submitEdit } = await setupLoaded();
    enterEditMode();

    // Act: DATE_ID_1 のみ変更（ok -> maybe）。DATE_ID_2 は未回答のまま触らない
    cycleAnswer(DATE_ID_1);
    await submitEdit();

    // Assert
    expect(upsertScheduleAnswers).toHaveBeenCalledTimes(1);
    expect(upsertScheduleAnswers).toHaveBeenCalledWith(LOBBY_ID, POLL_ID, {
      answers: [{ candidateDateId: DATE_ID_1, answer: 'maybe' }],
    });
  });

  it('変更がなければ API を呼ばない', async () => {
    // Arrange
    const { enterEditMode, submitEdit } = await setupLoaded();
    enterEditMode();

    // Act
    await submitEdit();

    // Assert
    expect(upsertScheduleAnswers).not.toHaveBeenCalled();
  });

  it('完了後に候補日を再取得する', async () => {
    // Arrange
    vi.mocked(upsertScheduleAnswers).mockResolvedValue([]);
    const { enterEditMode, cycleAnswer, submitEdit } = await setupLoaded();
    enterEditMode();
    cycleAnswer(DATE_ID_1);
    vi.mocked(getSchedulePoll).mockClear();

    // Act
    await submitEdit();

    // Assert
    expect(getSchedulePoll).toHaveBeenCalledWith(LOBBY_ID, POLL_ID);
  });

  it('完了後に isEditing を false にする', async () => {
    // Arrange
    vi.mocked(upsertScheduleAnswers).mockResolvedValue([]);
    const { enterEditMode, cycleAnswer, submitEdit, isEditing } =
      await setupLoaded();
    enterEditMode();
    cycleAnswer(DATE_ID_1);

    // Act
    await submitEdit();

    // Assert
    expect(isEditing.value).toBe(false);
  });

  it('409 のとき errorMessage を設定し onStale を呼ぶ（refetch はしない）', async () => {
    // Arrange
    const onStale = vi.fn();
    const {
      enterEditMode,
      cycleAnswer,
      submitEdit,
      errorMessage,
      isEditing,
      draftAnswers,
    } = await setupLoaded(POLL_ID, MY_ENTRY_ID, LobbyStatus.open, onStale);
    enterEditMode();
    cycleAnswer(DATE_ID_1);
    vi.mocked(upsertScheduleAnswers).mockRejectedValue(
      new ApiError(409, '新しい日程調整が始まっています'),
    );
    vi.mocked(getSchedulePoll).mockClear();

    // Act
    await submitEdit();

    // Assert
    expect(errorMessage.value).toBe(
      '新しい日程調整が始まっています。最新の状態を読み込み直してください',
    );
    expect(onStale).toHaveBeenCalledTimes(1);
    expect(getSchedulePoll).not.toHaveBeenCalled();
    expect(isEditing.value).toBe(false);
    expect(draftAnswers.value.size).toBe(0);
  });

  it('409 以外のエラーのとき errorMessage を設定し onStale は呼ばない', async () => {
    // Arrange
    const onStale = vi.fn();
    const { enterEditMode, cycleAnswer, submitEdit, errorMessage } =
      await setupLoaded(POLL_ID, MY_ENTRY_ID, LobbyStatus.open, onStale);
    enterEditMode();
    cycleAnswer(DATE_ID_1);
    vi.mocked(upsertScheduleAnswers).mockRejectedValue(new Error('network'));

    // Act
    await submitEdit();

    // Assert
    expect(errorMessage.value).toBe('日程回答の更新に失敗しました');
    expect(onStale).not.toHaveBeenCalled();
  });
});
