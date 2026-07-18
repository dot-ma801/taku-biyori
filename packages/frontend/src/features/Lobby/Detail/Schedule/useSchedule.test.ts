import { describe, it, expect, vi, beforeEach } from 'vitest';
import { useSchedule } from '@/features/Lobby/Detail/Schedule/useSchedule';
import { LobbyStatus } from '@taku-biyori/shared';
import type { LobbyAvailabilityDate } from '@taku-biyori/shared';

vi.mock('@/api/lobby', () => ({
  listLobbyAvailabilityDates: vi.fn(),
  updateLobbyAvailabilityDateResponse: vi.fn(),
}));

// composable を component 外で呼ぶため onMounted は no-op にし、
// 初期ロードはテスト側で明示的に refetch() を呼んで再現する（GameSession 側の既存テストに合わせる）。
vi.mock('vue', async (importOriginal) => {
  const actual = await importOriginal<typeof import('vue')>();
  return { ...actual, onMounted: vi.fn() };
});

import {
  listLobbyAvailabilityDates,
  updateLobbyAvailabilityDateResponse,
} from '@/api/lobby';

const LOBBY_ID = 'lobby-1';
const MY_MEMBER_ID = 'member-me';
const OTHER_MEMBER_ID = 'member-other';
const DATE_ID_1 = 'date-1';
const DATE_ID_2 = 'date-2';

function makeDates(): LobbyAvailabilityDate[] {
  return [
    {
      id: DATE_ID_1,
      date: '2026-07-01',
      answers: [
        { id: 'ans-1', memberId: MY_MEMBER_ID, answer: 'ok', comment: null },
        {
          id: 'ans-2',
          memberId: OTHER_MEMBER_ID,
          answer: 'ng',
          comment: null,
        },
      ],
    },
    {
      id: DATE_ID_2,
      date: '2026-07-02',
      answers: [],
    },
  ];
}

// 初期ロード済みの状態にした composable を返すヘルパー
// NOTE: status はデフォルト引数にすると「明示的に undefined を渡した」ケースと
// 「省略した」ケースを JS が区別できず、常にデフォルト値へ差し替わってしまう。
// そのため arguments.length で「渡されたかどうか」を判定する。
async function setupLoaded(
  dates: LobbyAvailabilityDate[] = makeDates(),
  myMemberId: string | null = MY_MEMBER_ID,
  status?: LobbyStatus,
) {
  const resolvedStatus = arguments.length >= 3 ? status : LobbyStatus.open;
  vi.mocked(listLobbyAvailabilityDates).mockResolvedValue(dates);
  const schedule = useSchedule(
    LOBBY_ID,
    () => myMemberId,
    () => resolvedStatus,
  );
  await schedule.refetch();
  return schedule;
}

beforeEach(() => {
  vi.clearAllMocks();
});

describe('refetch', () => {
  it('候補日一覧を取得して availabilityDates に格納する', async () => {
    // Arrange
    const dates = makeDates();

    // Act
    const { availabilityDates } = await setupLoaded(dates);

    // Assert
    expect(listLobbyAvailabilityDates).toHaveBeenCalledWith(LOBBY_ID);
    expect(availabilityDates.value).toEqual(dates);
  });

  it('取得に失敗したとき errorMessage を設定する', async () => {
    // Arrange
    vi.mocked(listLobbyAvailabilityDates).mockRejectedValue(new Error('ng'));
    const schedule = useSchedule(
      LOBBY_ID,
      () => MY_MEMBER_ID,
      () => LobbyStatus.open,
    );

    // Act
    await schedule.refetch();

    // Assert
    expect(schedule.errorMessage.value).toBe('候補日の取得に失敗しました');
  });
});

describe('canInputSchedule', () => {
  it.each([
    [LobbyStatus.open, true],
    [LobbyStatus.scheduling, true],
    [LobbyStatus.draft, false],
    [LobbyStatus.confirmed, false],
    [LobbyStatus.cancelled, false],
    [undefined, false],
  ])('status が %s のとき %s', async (status, expected) => {
    // Arrange
    const { canInputSchedule } = await setupLoaded(
      makeDates(),
      MY_MEMBER_ID,
      status,
    );

    // Assert
    expect(canInputSchedule.value).toBe(expected);
  });
});

describe('enterEditMode', () => {
  it('originalAnswers を draftAnswers にコピーする', async () => {
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
  it('original と異なる差分のみ API 送信する', async () => {
    // Arrange
    vi.mocked(updateLobbyAvailabilityDateResponse).mockResolvedValue({
      id: 'ans-1',
      memberId: MY_MEMBER_ID,
      answer: 'maybe',
      comment: null,
    });
    const { enterEditMode, cycleAnswer, submitEdit } = await setupLoaded();
    enterEditMode();

    // Act: DATE_ID_1 のみ変更（ok -> maybe）。DATE_ID_2 は未回答のまま触らない
    cycleAnswer(DATE_ID_1);
    await submitEdit();

    // Assert
    expect(updateLobbyAvailabilityDateResponse).toHaveBeenCalledTimes(1);
    expect(updateLobbyAvailabilityDateResponse).toHaveBeenCalledWith(
      LOBBY_ID,
      DATE_ID_1,
      { answer: 'maybe' },
    );
  });

  it('変更がなければ API を呼ばない', async () => {
    // Arrange
    const { enterEditMode, submitEdit } = await setupLoaded();
    enterEditMode();

    // Act
    await submitEdit();

    // Assert
    expect(updateLobbyAvailabilityDateResponse).not.toHaveBeenCalled();
  });

  it('完了後に候補日を再取得する', async () => {
    // Arrange
    vi.mocked(updateLobbyAvailabilityDateResponse).mockResolvedValue({
      id: 'ans-1',
      memberId: MY_MEMBER_ID,
      answer: 'maybe',
      comment: null,
    });
    const { enterEditMode, cycleAnswer, submitEdit } = await setupLoaded();
    enterEditMode();
    cycleAnswer(DATE_ID_1);
    vi.mocked(listLobbyAvailabilityDates).mockClear();

    // Act
    await submitEdit();

    // Assert
    expect(listLobbyAvailabilityDates).toHaveBeenCalledWith(LOBBY_ID);
  });

  it('完了後に isEditing を false にする', async () => {
    // Arrange
    vi.mocked(updateLobbyAvailabilityDateResponse).mockResolvedValue({
      id: 'ans-1',
      memberId: MY_MEMBER_ID,
      answer: 'maybe',
      comment: null,
    });
    const { enterEditMode, cycleAnswer, submitEdit, isEditing } =
      await setupLoaded();
    enterEditMode();
    cycleAnswer(DATE_ID_1);

    // Act
    await submitEdit();

    // Assert
    expect(isEditing.value).toBe(false);
  });

  it('myMemberId が null のときは originalAnswers が空になる', async () => {
    // Arrange
    const { enterEditMode, draftAnswers } = await setupLoaded(
      makeDates(),
      null,
    );

    // Act
    enterEditMode();

    // Assert
    expect(draftAnswers.value.size).toBe(0);
  });
});
