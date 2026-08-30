import { describe, it, expect, vi, beforeEach } from 'vitest';
import { ref } from 'vue';
import { useGuestSchedule } from '@/features/Lobby/Detail/Schedule/useGuestSchedule';
import { LobbyStatus } from '@taku-biyori/shared';
import type {
  LobbyAvailabilityDate,
  LobbyAvailabilityDateAnswer,
} from '@taku-biyori/shared';

vi.mock('@/api/lobby', () => ({
  updateGuestLobbyAvailabilityDateResponse: vi.fn(),
}));

const mockToastError = vi.fn();
vi.mock('@/composables/useToast', () => ({
  useToast: () => ({ error: mockToastError }),
}));

import { updateGuestLobbyAvailabilityDateResponse } from '@/api/lobby';

const LOBBY_ID = 'lobby-1';
const TOKEN = 'guest-token-abc';
const DATE_ID = 'date-1';
const GUEST_MEMBER_ID = 'member-guest-1';

function makeDates(): LobbyAvailabilityDate[] {
  return [
    {
      id: DATE_ID,
      date: '2026-07-01',
      dateNote: null,
      answers: [
        { id: 'ans-1', memberId: GUEST_MEMBER_ID, answer: 'ok', comment: null },
      ],
    },
  ];
}

// API（PUT guest-responses）は更新後の回答1件を返す
function makeAnswer(): LobbyAvailabilityDateAnswer {
  return {
    id: 'ans-1',
    memberId: GUEST_MEMBER_ID,
    answer: 'maybe',
    comment: null,
  };
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
      makeDates(),
      LobbyStatus.open,
      vi.fn(),
    );

    // Assert
    expect(canEditGuestSchedule.value).toBe(true);
  });

  it('トークンがあり status が scheduling のとき true', () => {
    // Act
    const { canEditGuestSchedule } = useGuestSchedule(
      LOBBY_ID,
      TOKEN,
      makeDates(),
      LobbyStatus.scheduling,
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
      makeDates(),
      LobbyStatus.open,
      vi.fn(),
    );

    // Assert
    expect(canEditGuestSchedule.value).toBe(false);
  });

  it('status が open / scheduling 以外のとき false', () => {
    // Act
    const { canEditGuestSchedule } = useGuestSchedule(
      LOBBY_ID,
      TOKEN,
      makeDates(),
      LobbyStatus.cancelled,
      vi.fn(),
    );

    // Assert
    expect(canEditGuestSchedule.value).toBe(false);
  });
});

describe('currentAnswerOf', () => {
  it('ドラフトがなければサーバ値を返す', () => {
    // Act
    const { currentAnswerOf } = useGuestSchedule(
      LOBBY_ID,
      TOKEN,
      makeDates(),
      LobbyStatus.open,
      vi.fn(),
    );

    // Assert
    expect(currentAnswerOf(GUEST_MEMBER_ID, DATE_ID)).toBe('ok');
  });

  it('回答がないメンバーは null を返す', () => {
    // Act
    const { currentAnswerOf } = useGuestSchedule(
      LOBBY_ID,
      TOKEN,
      makeDates(),
      LobbyStatus.open,
      vi.fn(),
    );

    // Assert
    expect(currentAnswerOf('member-guest-2', DATE_ID)).toBeNull();
  });

  it('ドラフトがあればドラフトを優先する', () => {
    // Arrange
    const { currentAnswerOf, cycleAnswer } = useGuestSchedule(
      LOBBY_ID,
      TOKEN,
      makeDates(),
      LobbyStatus.open,
      vi.fn(),
    );

    // Act: ok -> maybe
    cycleAnswer(GUEST_MEMBER_ID, DATE_ID);

    // Assert
    expect(currentAnswerOf(GUEST_MEMBER_ID, DATE_ID)).toBe('maybe');
  });
});

describe('cycleAnswer', () => {
  it('回答がないメンバーは ok から始まる', () => {
    // Arrange
    const { currentAnswerOf, cycleAnswer } = useGuestSchedule(
      LOBBY_ID,
      TOKEN,
      makeDates(),
      LobbyStatus.open,
      vi.fn(),
    );

    // Act
    cycleAnswer('member-guest-2', DATE_ID);

    // Assert
    expect(currentAnswerOf('member-guest-2', DATE_ID)).toBe('ok');
  });

  it('ok -> maybe -> ng -> ok の順に循環する', () => {
    // Arrange
    const { currentAnswerOf, cycleAnswer } = useGuestSchedule(
      LOBBY_ID,
      TOKEN,
      makeDates(),
      LobbyStatus.open,
      vi.fn(),
    );

    // Act & Assert
    cycleAnswer(GUEST_MEMBER_ID, DATE_ID);
    expect(currentAnswerOf(GUEST_MEMBER_ID, DATE_ID)).toBe('maybe');
    cycleAnswer(GUEST_MEMBER_ID, DATE_ID);
    expect(currentAnswerOf(GUEST_MEMBER_ID, DATE_ID)).toBe('ng');
    cycleAnswer(GUEST_MEMBER_ID, DATE_ID);
    expect(currentAnswerOf(GUEST_MEMBER_ID, DATE_ID)).toBe('ok');
  });
});

describe('hasChanges', () => {
  it('ドラフトがサーバ値と異なれば true', () => {
    // Arrange
    const { hasChanges, cycleAnswer } = useGuestSchedule(
      LOBBY_ID,
      TOKEN,
      makeDates(),
      LobbyStatus.open,
      vi.fn(),
    );

    // Act
    cycleAnswer(GUEST_MEMBER_ID, DATE_ID);

    // Assert
    expect(hasChanges.value).toBe(true);
  });

  it('ドラフトがサーバ値と同じなら false', () => {
    // Arrange
    const { hasChanges, cycleAnswer } = useGuestSchedule(
      LOBBY_ID,
      TOKEN,
      makeDates(),
      LobbyStatus.open,
      vi.fn(),
    );

    // Act: ok -> maybe -> ng -> ok（元に戻る）
    cycleAnswer(GUEST_MEMBER_ID, DATE_ID);
    cycleAnswer(GUEST_MEMBER_ID, DATE_ID);
    cycleAnswer(GUEST_MEMBER_ID, DATE_ID);

    // Assert
    expect(hasChanges.value).toBe(false);
  });
});

describe('submitEdit', () => {
  it('変更したセルを memberId 付きで API 送信する', async () => {
    // Arrange
    vi.mocked(updateGuestLobbyAvailabilityDateResponse).mockResolvedValue(
      makeAnswer(),
    );
    const { cycleAnswer, submitEdit } = useGuestSchedule(
      LOBBY_ID,
      TOKEN,
      makeDates(),
      LobbyStatus.open,
      vi.fn(),
    );

    // Act: ok -> maybe
    cycleAnswer(GUEST_MEMBER_ID, DATE_ID);
    await submitEdit();

    // Assert
    expect(updateGuestLobbyAvailabilityDateResponse).toHaveBeenCalledWith(
      LOBBY_ID,
      DATE_ID,
      TOKEN,
      { memberId: GUEST_MEMBER_ID, answer: 'maybe' },
    );
  });

  it('成功後にサーバ再取得(onUpdated)を1度だけ呼び出す', async () => {
    // Arrange
    vi.mocked(updateGuestLobbyAvailabilityDateResponse).mockResolvedValue(
      makeAnswer(),
    );
    const onUpdated = vi.fn();
    const { cycleAnswer, submitEdit } = useGuestSchedule(
      LOBBY_ID,
      TOKEN,
      makeDates(),
      LobbyStatus.open,
      onUpdated,
    );

    // Act
    cycleAnswer(GUEST_MEMBER_ID, DATE_ID);
    await submitEdit();

    // Assert: サーバが SSOT。クライアントで状態を組み立てず再取得させる
    expect(onUpdated).toHaveBeenCalledTimes(1);
    expect(onUpdated).toHaveBeenCalledWith();
  });

  it('成功後に isEditing が false になる', async () => {
    // Arrange
    vi.mocked(updateGuestLobbyAvailabilityDateResponse).mockResolvedValue(
      makeAnswer(),
    );
    const { cycleAnswer, submitEdit, isEditing, enterEditMode } =
      useGuestSchedule(LOBBY_ID, TOKEN, makeDates(), LobbyStatus.open, vi.fn());

    // Act
    enterEditMode();
    cycleAnswer(GUEST_MEMBER_ID, DATE_ID);
    await submitEdit();

    // Assert
    expect(isEditing.value).toBe(false);
  });

  it('変更がなければ API を呼ばない', async () => {
    // Arrange
    const { submitEdit } = useGuestSchedule(
      LOBBY_ID,
      TOKEN,
      makeDates(),
      LobbyStatus.open,
      vi.fn(),
    );

    // Act
    await submitEdit();

    // Assert
    expect(updateGuestLobbyAvailabilityDateResponse).not.toHaveBeenCalled();
  });

  it('変更なし退出時にドラフトもクリアされる', async () => {
    // Arrange: ドラフトをセルと同じ値（ok->maybe->ng->ok）に戻して変更なし状態に
    const { cycleAnswer, draftAnswers, isEditing, enterEditMode, submitEdit } =
      useGuestSchedule(LOBBY_ID, TOKEN, makeDates(), LobbyStatus.open, vi.fn());
    enterEditMode();
    // ok -> maybe -> ng -> ok （元に戻す）
    cycleAnswer(GUEST_MEMBER_ID, DATE_ID);
    cycleAnswer(GUEST_MEMBER_ID, DATE_ID);
    cycleAnswer(GUEST_MEMBER_ID, DATE_ID);

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
      makeDates(),
      LobbyStatus.open,
      vi.fn(),
    );

    // Act
    cycleAnswer(GUEST_MEMBER_ID, DATE_ID);
    await submitEdit();

    // Assert
    expect(updateGuestLobbyAvailabilityDateResponse).not.toHaveBeenCalled();
  });

  it('API エラー時に error トーストを表示する', async () => {
    // Arrange
    vi.mocked(updateGuestLobbyAvailabilityDateResponse).mockRejectedValue(
      new Error('サーバーエラー'),
    );
    const { cycleAnswer, submitEdit } = useGuestSchedule(
      LOBBY_ID,
      TOKEN,
      makeDates(),
      LobbyStatus.open,
      vi.fn(),
    );

    // Act
    cycleAnswer(GUEST_MEMBER_ID, DATE_ID);
    await submitEdit();

    // Assert
    expect(mockToastError).toHaveBeenCalledWith('日程回答の更新に失敗しました');
  });

  it('API エラー時でも onUpdated を呼んで親状態を再同期する', async () => {
    // Arrange
    vi.mocked(updateGuestLobbyAvailabilityDateResponse).mockRejectedValue(
      new Error('サーバーエラー'),
    );
    const onUpdated = vi.fn();
    const { cycleAnswer, submitEdit } = useGuestSchedule(
      LOBBY_ID,
      TOKEN,
      makeDates(),
      LobbyStatus.open,
      onUpdated,
    );

    // Act
    cycleAnswer(GUEST_MEMBER_ID, DATE_ID);
    await submitEdit();

    // Assert: 半 commit 解消のため失敗時にも再取得する
    expect(onUpdated).toHaveBeenCalledTimes(1);
  });

  it('loading 中の重複呼び出しは無視する', async () => {
    // Arrange
    let resolve!: (a: LobbyAvailabilityDateAnswer) => void;
    vi.mocked(updateGuestLobbyAvailabilityDateResponse).mockReturnValue(
      new Promise((r) => {
        resolve = r;
      }),
    );
    const { cycleAnswer, submitEdit } = useGuestSchedule(
      LOBBY_ID,
      TOKEN,
      makeDates(),
      LobbyStatus.open,
      vi.fn(),
    );
    cycleAnswer(GUEST_MEMBER_ID, DATE_ID);

    // Act
    const first = submitEdit();
    await submitEdit();
    resolve(makeAnswer());
    await first;

    // Assert
    expect(updateGuestLobbyAvailabilityDateResponse).toHaveBeenCalledTimes(1);
  });

  it('availabilityDates を getter で渡しても最新値を参照する', async () => {
    // Arrange
    const dates = ref<LobbyAvailabilityDate[]>([]);
    const { currentAnswerOf } = useGuestSchedule(
      LOBBY_ID,
      TOKEN,
      () => dates.value,
      LobbyStatus.open,
      vi.fn(),
    );
    expect(currentAnswerOf(GUEST_MEMBER_ID, DATE_ID)).toBeNull();

    // Act
    dates.value = makeDates();

    // Assert
    expect(currentAnswerOf(GUEST_MEMBER_ID, DATE_ID)).toBe('ok');
  });
});
