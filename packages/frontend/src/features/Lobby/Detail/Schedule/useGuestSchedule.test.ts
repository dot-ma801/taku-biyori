import { describe, it, expect, vi, beforeEach } from 'vitest';
import { ref } from 'vue';
import { useGuestSchedule } from '@/features/Lobby/Detail/Schedule/useGuestSchedule';
import { LobbyStatus } from '@taku-biyori/shared';
import { ApiError } from '@/lib/api-client';
import type {
  CandidateDateModel,
  ScheduleAnswerModel,
} from '@/models/schedule-poll';

vi.mock('@/api/lobby', () => ({
  upsertGuestScheduleAnswers: vi.fn(),
}));

const mockToastError = vi.fn();
vi.mock('@/composables/useToast', () => ({
  useToast: () => ({ error: mockToastError }),
}));

import { upsertGuestScheduleAnswers } from '@/api/lobby';

const LOBBY_ID = 'lobby-1';
const POLL_ID = 'poll-1';
const TOKEN = 'guest-token-abc';
const DATE_ID = 'date-1';
const DATE_ID_2 = 'date-2';
const GUEST_ENTRY_ID = 'entry-guest-1';
const OTHER_GUEST_ENTRY_ID = 'entry-guest-2';

function makeDates(): CandidateDateModel[] {
  return [
    {
      id: DATE_ID,
      date: '2026-07-01',
      timeLabel: null,
      answersByEntryId: new Map([
        [
          GUEST_ENTRY_ID,
          { id: 'ans-1', entryId: GUEST_ENTRY_ID, answer: 'ok', comment: null },
        ],
      ]),
    },
    {
      id: DATE_ID_2,
      date: '2026-07-02',
      timeLabel: null,
      answersByEntryId: new Map(),
    },
  ];
}

// API（PATCH guest-answers）は更新後の回答一覧を返す
function makeAnswers(): ScheduleAnswerModel[] {
  return [
    { id: 'ans-1', entryId: GUEST_ENTRY_ID, answer: 'maybe', comment: null },
  ];
}

beforeEach(() => {
  vi.clearAllMocks();
});

describe('canEditGuestSchedule', () => {
  it('トークンがあり status が open のとき true', () => {
    // Act
    const { canEditGuestSchedule } = useGuestSchedule(
      LOBBY_ID,
      TOKEN,
      POLL_ID,
      makeDates(),
      LobbyStatus.open,
      vi.fn(),
      vi.fn(),
    );

    // Assert
    expect(canEditGuestSchedule.value).toBe(true);
  });

  it('トークンがあり status が closed のとき true', () => {
    // Act
    const { canEditGuestSchedule } = useGuestSchedule(
      LOBBY_ID,
      TOKEN,
      POLL_ID,
      makeDates(),
      LobbyStatus.closed,
      vi.fn(),
      vi.fn(),
    );

    // Assert
    expect(canEditGuestSchedule.value).toBe(true);
  });

  it('トークンが null のとき false', () => {
    // Act
    const { canEditGuestSchedule } = useGuestSchedule(
      LOBBY_ID,
      null,
      POLL_ID,
      makeDates(),
      LobbyStatus.open,
      vi.fn(),
      vi.fn(),
    );

    // Assert
    expect(canEditGuestSchedule.value).toBe(false);
  });

  it('status が open / closed 以外のとき false', () => {
    // Act
    const { canEditGuestSchedule } = useGuestSchedule(
      LOBBY_ID,
      TOKEN,
      POLL_ID,
      makeDates(),
      LobbyStatus.disbanded,
      vi.fn(),
      vi.fn(),
    );

    // Assert
    expect(canEditGuestSchedule.value).toBe(false);
  });
});

describe('currentAnswerOf', () => {
  it('ドラフトがなければサーバ値（answersByEntryId）を返す', () => {
    // Act
    const { currentAnswerOf } = useGuestSchedule(
      LOBBY_ID,
      TOKEN,
      POLL_ID,
      makeDates(),
      LobbyStatus.open,
      vi.fn(),
      vi.fn(),
    );

    // Assert
    expect(currentAnswerOf(GUEST_ENTRY_ID, DATE_ID)).toBe('ok');
  });

  it('回答がないゲスト列は null を返す', () => {
    // Act
    const { currentAnswerOf } = useGuestSchedule(
      LOBBY_ID,
      TOKEN,
      POLL_ID,
      makeDates(),
      LobbyStatus.open,
      vi.fn(),
      vi.fn(),
    );

    // Assert
    expect(currentAnswerOf(OTHER_GUEST_ENTRY_ID, DATE_ID)).toBeNull();
  });

  it('ドラフトがあればドラフトを優先する', () => {
    // Arrange
    const { currentAnswerOf, cycleAnswer } = useGuestSchedule(
      LOBBY_ID,
      TOKEN,
      POLL_ID,
      makeDates(),
      LobbyStatus.open,
      vi.fn(),
      vi.fn(),
    );

    // Act: ok -> maybe
    cycleAnswer(GUEST_ENTRY_ID, DATE_ID);

    // Assert
    expect(currentAnswerOf(GUEST_ENTRY_ID, DATE_ID)).toBe('maybe');
  });
});

describe('cycleAnswer', () => {
  it('回答がないゲスト列は ok から始まる', () => {
    // Arrange
    const { currentAnswerOf, cycleAnswer } = useGuestSchedule(
      LOBBY_ID,
      TOKEN,
      POLL_ID,
      makeDates(),
      LobbyStatus.open,
      vi.fn(),
      vi.fn(),
    );

    // Act
    cycleAnswer(OTHER_GUEST_ENTRY_ID, DATE_ID);

    // Assert
    expect(currentAnswerOf(OTHER_GUEST_ENTRY_ID, DATE_ID)).toBe('ok');
  });

  it('ok -> maybe -> ng -> ok の順に循環する', () => {
    // Arrange
    const { currentAnswerOf, cycleAnswer } = useGuestSchedule(
      LOBBY_ID,
      TOKEN,
      POLL_ID,
      makeDates(),
      LobbyStatus.open,
      vi.fn(),
      vi.fn(),
    );

    // Act & Assert
    cycleAnswer(GUEST_ENTRY_ID, DATE_ID);
    expect(currentAnswerOf(GUEST_ENTRY_ID, DATE_ID)).toBe('maybe');
    cycleAnswer(GUEST_ENTRY_ID, DATE_ID);
    expect(currentAnswerOf(GUEST_ENTRY_ID, DATE_ID)).toBe('ng');
    cycleAnswer(GUEST_ENTRY_ID, DATE_ID);
    expect(currentAnswerOf(GUEST_ENTRY_ID, DATE_ID)).toBe('ok');
  });
});

describe('hasChanges', () => {
  it('ドラフトがサーバ値と異なれば true', () => {
    // Arrange
    const { hasChanges, cycleAnswer } = useGuestSchedule(
      LOBBY_ID,
      TOKEN,
      POLL_ID,
      makeDates(),
      LobbyStatus.open,
      vi.fn(),
      vi.fn(),
    );

    // Act
    cycleAnswer(GUEST_ENTRY_ID, DATE_ID);

    // Assert
    expect(hasChanges.value).toBe(true);
  });

  it('ドラフトがサーバ値と同じなら false', () => {
    // Arrange
    const { hasChanges, cycleAnswer } = useGuestSchedule(
      LOBBY_ID,
      TOKEN,
      POLL_ID,
      makeDates(),
      LobbyStatus.open,
      vi.fn(),
      vi.fn(),
    );

    // Act: ok -> maybe -> ng -> ok（元に戻る）
    cycleAnswer(GUEST_ENTRY_ID, DATE_ID);
    cycleAnswer(GUEST_ENTRY_ID, DATE_ID);
    cycleAnswer(GUEST_ENTRY_ID, DATE_ID);

    // Assert
    expect(hasChanges.value).toBe(false);
  });
});

describe('submitEdit', () => {
  it('変更したゲスト列ごとに entryId 付きで1リクエストにまとめて送信する', async () => {
    // Arrange
    vi.mocked(upsertGuestScheduleAnswers).mockResolvedValue(makeAnswers());
    const { cycleAnswer, submitEdit } = useGuestSchedule(
      LOBBY_ID,
      TOKEN,
      POLL_ID,
      makeDates(),
      LobbyStatus.open,
      vi.fn(),
      vi.fn(),
    );

    // Act: ok -> maybe（DATE_ID）、DATE_ID_2 は未回答から ok
    cycleAnswer(GUEST_ENTRY_ID, DATE_ID);
    cycleAnswer(GUEST_ENTRY_ID, DATE_ID_2);
    await submitEdit();

    // Assert: 同じ entryId の変更は1リクエストにまとめる
    expect(upsertGuestScheduleAnswers).toHaveBeenCalledTimes(1);
    expect(upsertGuestScheduleAnswers).toHaveBeenCalledWith(
      LOBBY_ID,
      POLL_ID,
      TOKEN,
      {
        entryId: GUEST_ENTRY_ID,
        answers: [
          { candidateDateId: DATE_ID, answer: 'maybe' },
          { candidateDateId: DATE_ID_2, answer: 'ok' },
        ],
      },
    );
  });

  it('複数のゲスト列を変更したときは entryId ごとに1リクエストずつ送信する', async () => {
    // Arrange
    vi.mocked(upsertGuestScheduleAnswers).mockResolvedValue(makeAnswers());
    const { cycleAnswer, submitEdit } = useGuestSchedule(
      LOBBY_ID,
      TOKEN,
      POLL_ID,
      makeDates(),
      LobbyStatus.open,
      vi.fn(),
      vi.fn(),
    );

    // Act
    cycleAnswer(GUEST_ENTRY_ID, DATE_ID);
    cycleAnswer(OTHER_GUEST_ENTRY_ID, DATE_ID);
    await submitEdit();

    // Assert
    expect(upsertGuestScheduleAnswers).toHaveBeenCalledTimes(2);
    expect(upsertGuestScheduleAnswers).toHaveBeenCalledWith(
      LOBBY_ID,
      POLL_ID,
      TOKEN,
      {
        entryId: GUEST_ENTRY_ID,
        answers: [{ candidateDateId: DATE_ID, answer: 'maybe' }],
      },
    );
    expect(upsertGuestScheduleAnswers).toHaveBeenCalledWith(
      LOBBY_ID,
      POLL_ID,
      TOKEN,
      {
        entryId: OTHER_GUEST_ENTRY_ID,
        answers: [{ candidateDateId: DATE_ID, answer: 'ok' }],
      },
    );
  });

  it('成功後にサーバ再取得(onUpdated)を1度だけ呼び出す', async () => {
    // Arrange
    vi.mocked(upsertGuestScheduleAnswers).mockResolvedValue(makeAnswers());
    const onUpdated = vi.fn();
    const { cycleAnswer, submitEdit } = useGuestSchedule(
      LOBBY_ID,
      TOKEN,
      POLL_ID,
      makeDates(),
      LobbyStatus.open,
      onUpdated,
      vi.fn(),
    );

    // Act
    cycleAnswer(GUEST_ENTRY_ID, DATE_ID);
    await submitEdit();

    // Assert: サーバが SSOT。クライアントで状態を組み立てず再取得させる
    expect(onUpdated).toHaveBeenCalledTimes(1);
    expect(onUpdated).toHaveBeenCalledWith();
  });

  it('成功後に isEditing が false になる', async () => {
    // Arrange
    vi.mocked(upsertGuestScheduleAnswers).mockResolvedValue(makeAnswers());
    const { cycleAnswer, submitEdit, isEditing, enterEditMode } =
      useGuestSchedule(
        LOBBY_ID,
        TOKEN,
        POLL_ID,
        makeDates(),
        LobbyStatus.open,
        vi.fn(),
        vi.fn(),
      );

    // Act
    enterEditMode();
    cycleAnswer(GUEST_ENTRY_ID, DATE_ID);
    await submitEdit();

    // Assert
    expect(isEditing.value).toBe(false);
  });

  it('変更がなければ API を呼ばない', async () => {
    // Arrange
    const { submitEdit } = useGuestSchedule(
      LOBBY_ID,
      TOKEN,
      POLL_ID,
      makeDates(),
      LobbyStatus.open,
      vi.fn(),
      vi.fn(),
    );

    // Act
    await submitEdit();

    // Assert
    expect(upsertGuestScheduleAnswers).not.toHaveBeenCalled();
  });

  it('変更なし退出時にドラフトもクリアされる', async () => {
    // Arrange: ドラフトをセルと同じ値（ok->maybe->ng->ok）に戻して変更なし状態に
    const { cycleAnswer, draftAnswers, isEditing, enterEditMode, submitEdit } =
      useGuestSchedule(
        LOBBY_ID,
        TOKEN,
        POLL_ID,
        makeDates(),
        LobbyStatus.open,
        vi.fn(),
        vi.fn(),
      );
    enterEditMode();
    // ok -> maybe -> ng -> ok （元に戻す）
    cycleAnswer(GUEST_ENTRY_ID, DATE_ID);
    cycleAnswer(GUEST_ENTRY_ID, DATE_ID);
    cycleAnswer(GUEST_ENTRY_ID, DATE_ID);

    // Act
    await submitEdit();

    // Assert: ドラフトがクリアされ isEditing も false になる
    expect(draftAnswers.value.size).toBe(0);
    expect(isEditing.value).toBe(false);
  });

  it('token が null のときは API を呼ばない', async () => {
    // Arrange
    const { cycleAnswer, submitEdit } = useGuestSchedule(
      LOBBY_ID,
      null,
      POLL_ID,
      makeDates(),
      LobbyStatus.open,
      vi.fn(),
      vi.fn(),
    );

    // Act
    cycleAnswer(GUEST_ENTRY_ID, DATE_ID);
    await submitEdit();

    // Assert
    expect(upsertGuestScheduleAnswers).not.toHaveBeenCalled();
  });

  it('pollId が null のときは API を呼ばない', async () => {
    // Arrange
    const { cycleAnswer, submitEdit } = useGuestSchedule(
      LOBBY_ID,
      TOKEN,
      null,
      makeDates(),
      LobbyStatus.open,
      vi.fn(),
      vi.fn(),
    );

    // Act
    cycleAnswer(GUEST_ENTRY_ID, DATE_ID);
    await submitEdit();

    // Assert
    expect(upsertGuestScheduleAnswers).not.toHaveBeenCalled();
  });

  it('API エラー時に error トーストを表示する', async () => {
    // Arrange
    vi.mocked(upsertGuestScheduleAnswers).mockRejectedValue(
      new Error('サーバーエラー'),
    );
    const { cycleAnswer, submitEdit } = useGuestSchedule(
      LOBBY_ID,
      TOKEN,
      POLL_ID,
      makeDates(),
      LobbyStatus.open,
      vi.fn(),
      vi.fn(),
    );

    // Act
    cycleAnswer(GUEST_ENTRY_ID, DATE_ID);
    await submitEdit();

    // Assert
    expect(mockToastError).toHaveBeenCalledWith('日程回答の更新に失敗しました');
  });

  it('API エラー時でも onUpdated を呼んで親状態を再同期する', async () => {
    // Arrange
    vi.mocked(upsertGuestScheduleAnswers).mockRejectedValue(
      new Error('サーバーエラー'),
    );
    const onUpdated = vi.fn();
    const { cycleAnswer, submitEdit } = useGuestSchedule(
      LOBBY_ID,
      TOKEN,
      POLL_ID,
      makeDates(),
      LobbyStatus.open,
      onUpdated,
      vi.fn(),
    );

    // Act
    cycleAnswer(GUEST_ENTRY_ID, DATE_ID);
    await submitEdit();

    // Assert: 半 commit 解消のため失敗時にも再取得する
    expect(onUpdated).toHaveBeenCalledTimes(1);
  });

  it('409 のとき errorMessage を設定し onStale を呼ぶ（onUpdated は呼ばない）', async () => {
    // Arrange
    vi.mocked(upsertGuestScheduleAnswers).mockRejectedValue(
      new ApiError(409, '新しい日程調整が始まっています'),
    );
    const onUpdated = vi.fn();
    const onStale = vi.fn();
    const {
      cycleAnswer,
      submitEdit,
      errorMessage,
      isEditing,
      draftAnswers,
      enterEditMode,
    } = useGuestSchedule(
      LOBBY_ID,
      TOKEN,
      POLL_ID,
      makeDates(),
      LobbyStatus.open,
      onUpdated,
      onStale,
    );
    enterEditMode();
    cycleAnswer(GUEST_ENTRY_ID, DATE_ID);

    // Act
    await submitEdit();

    // Assert
    expect(errorMessage.value).toBe(
      '新しい日程調整が始まっています。最新の状態を読み込み直してください',
    );
    expect(onStale).toHaveBeenCalledTimes(1);
    expect(onUpdated).not.toHaveBeenCalled();
    expect(isEditing.value).toBe(false);
    expect(draftAnswers.value.size).toBe(0);
  });

  it('loading 中の重複呼び出しは無視する', async () => {
    // Arrange
    let resolve!: (a: ScheduleAnswerModel[]) => void;
    vi.mocked(upsertGuestScheduleAnswers).mockReturnValue(
      new Promise((r) => {
        resolve = r;
      }),
    );
    const { cycleAnswer, submitEdit } = useGuestSchedule(
      LOBBY_ID,
      TOKEN,
      POLL_ID,
      makeDates(),
      LobbyStatus.open,
      vi.fn(),
      vi.fn(),
    );
    cycleAnswer(GUEST_ENTRY_ID, DATE_ID);

    // Act
    const first = submitEdit();
    await submitEdit();
    resolve(makeAnswers());
    await first;

    // Assert
    expect(upsertGuestScheduleAnswers).toHaveBeenCalledTimes(1);
  });

  it('candidateDates を getter で渡しても最新値を参照する', async () => {
    // Arrange
    const dates = ref<CandidateDateModel[]>([]);
    const { currentAnswerOf } = useGuestSchedule(
      LOBBY_ID,
      TOKEN,
      POLL_ID,
      () => dates.value,
      LobbyStatus.open,
      vi.fn(),
      vi.fn(),
    );
    expect(currentAnswerOf(GUEST_ENTRY_ID, DATE_ID)).toBeNull();

    // Act
    dates.value = makeDates();

    // Assert
    expect(currentAnswerOf(GUEST_ENTRY_ID, DATE_ID)).toBe('ok');
  });
});
