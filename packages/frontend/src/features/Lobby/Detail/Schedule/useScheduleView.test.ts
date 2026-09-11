import { describe, it, expect } from 'vitest';
import { ref } from 'vue';
import type { LobbyEntryModel } from '@/models/lobby';
import type {
  CandidateDateModel,
  ScheduleAnswerValue,
} from '@/models/schedule-poll';
import { useScheduleView } from '@/features/Lobby/Detail/Schedule/useScheduleView';

const ENTRY_A = 'entry-a';
const ENTRY_B = 'entry-b';
const ENTRY_C = 'entry-c';
const DATE_ID = 'date-1';

function makeMember(id: string): LobbyEntryModel {
  return {
    id,
    userId: null,
    userName: null,
    guestName: id,
    joinedAt: new Date('2026-01-01T00:00:00Z'),
    leftAt: null,
  };
}

function makeDate(
  answers: { entryId: string; answer: ScheduleAnswerValue }[],
  overrides: Partial<CandidateDateModel> = {},
): CandidateDateModel {
  return {
    id: DATE_ID,
    date: '2026-06-02',
    timeLabel: null,
    answersByEntryId: new Map(
      answers.map((a, i) => [
        a.entryId,
        {
          id: `answer-${i}`,
          entryId: a.entryId,
          answer: a.answer,
          comment: null,
        },
      ]),
    ),
    ...overrides,
  };
}

function setup(
  editableEntryIds: string[] = [],
  draftAnswers: Map<string, ScheduleAnswerValue> = new Map(),
) {
  return useScheduleView(ref(editableEntryIds), ref(draftAnswers));
}

function setupWithDates(candidateDates: CandidateDateModel[]) {
  return useScheduleView(
    ref<string[]>([]),
    ref(new Map<string, ScheduleAnswerValue>()),
    ref(candidateDates),
  );
}

describe('getAnswer', () => {
  it('API の回答をそのまま返す', () => {
    // Arrange
    const date = makeDate([{ entryId: ENTRY_A, answer: 'ok' }]);
    const { getAnswer } = setup();

    // Act
    const result = getAnswer(date, ENTRY_A);

    // Assert
    expect(result).toBe('ok');
  });

  it('回答がないメンバーには null を返す', () => {
    // Arrange
    const date = makeDate([{ entryId: ENTRY_A, answer: 'ok' }]);
    const { getAnswer } = setup();

    // Act
    const result = getAnswer(date, ENTRY_B);

    // Assert
    expect(result).toBeNull();
  });

  it('編集可能なメンバーは draft を優先して返す', () => {
    // Arrange
    const date = makeDate([{ entryId: ENTRY_A, answer: 'ok' }]);
    const draft = new Map<string, ScheduleAnswerValue>([
      [`${ENTRY_A}::${DATE_ID}`, 'ng'],
    ]);
    const { getAnswer } = setup([ENTRY_A], draft);

    // Act
    const result = getAnswer(date, ENTRY_A);

    // Assert
    expect(result).toBe('ng');
  });

  it('編集可能でないメンバーの draft は無視する', () => {
    // Arrange
    const date = makeDate([{ entryId: ENTRY_A, answer: 'ok' }]);
    const draft = new Map<string, ScheduleAnswerValue>([
      [`${ENTRY_A}::${DATE_ID}`, 'ng'],
    ]);
    const { getAnswer } = setup([], draft);

    // Act
    const result = getAnswer(date, ENTRY_A);

    // Assert
    expect(result).toBe('ok');
  });

  it('editableEntryIds・draftAnswers を getter で渡しても最新値を参照する', () => {
    // Arrange
    const date = makeDate([{ entryId: ENTRY_A, answer: 'ok' }]);
    const editableEntryIds = ref<string[]>([]);
    const draftAnswers = ref<Map<string, ScheduleAnswerValue>>(new Map());
    const { getAnswer } = useScheduleView(
      () => editableEntryIds.value,
      () => draftAnswers.value,
    );

    // Act & Assert（draft 未反映時は API の値）
    expect(getAnswer(date, ENTRY_A)).toBe('ok');

    // Act: 編集可能にして draft を書き込む
    editableEntryIds.value = [ENTRY_A];
    draftAnswers.value = new Map([[`${ENTRY_A}::${DATE_ID}`, 'ng']]);

    // Assert
    expect(getAnswer(date, ENTRY_A)).toBe('ng');
  });
});

describe('okCount', () => {
  it('ok と回答したメンバー数を返す', () => {
    // Arrange
    const date = makeDate([
      { entryId: ENTRY_A, answer: 'ok' },
      { entryId: ENTRY_B, answer: 'maybe' },
      { entryId: ENTRY_C, answer: 'ok' },
    ]);
    const members = [ENTRY_A, ENTRY_B, ENTRY_C].map(makeMember);
    const { okCount } = setup();

    // Act
    const result = okCount(date, members);

    // Assert
    expect(result).toBe(2);
  });
});

describe('answerCounts', () => {
  it('ok・maybe・ng の件数をそれぞれ集計する', () => {
    // Arrange
    const date = makeDate([
      { entryId: ENTRY_A, answer: 'ok' },
      { entryId: ENTRY_B, answer: 'maybe' },
      { entryId: ENTRY_C, answer: 'ng' },
    ]);
    const members = [ENTRY_A, ENTRY_B, ENTRY_C].map(makeMember);
    const { answerCounts } = setup();

    // Act
    const result = answerCounts(date, members);

    // Assert
    expect(result).toEqual({ ok: 1, maybe: 1, ng: 1 });
  });

  it('未回答のメンバーはどのカウントにも含めない', () => {
    // Arrange
    const date = makeDate([{ entryId: ENTRY_A, answer: 'ok' }]);
    const members = [ENTRY_A, ENTRY_B, ENTRY_C].map(makeMember);
    const { answerCounts } = setup();

    // Act
    const result = answerCounts(date, members);

    // Assert
    expect(result).toEqual({ ok: 1, maybe: 0, ng: 0 });
  });

  it('編集可能なメンバーは draft を反映して集計する', () => {
    // Arrange
    const date = makeDate([
      { entryId: ENTRY_A, answer: 'ok' },
      { entryId: ENTRY_B, answer: 'ng' },
    ]);
    const draft = new Map<string, ScheduleAnswerValue>([
      [`${ENTRY_A}::${DATE_ID}`, 'maybe'],
    ]);
    const members = [ENTRY_A, ENTRY_B].map(makeMember);
    const { answerCounts } = setup([ENTRY_A], draft);

    // Act
    const result = answerCounts(date, members);

    // Assert
    expect(result).toEqual({ ok: 0, maybe: 1, ng: 1 });
  });
});

describe('hasAnyTimeLabel', () => {
  // ホストが「ひとこと（時間帯）」を1件も書いていなければ表に列を出さないための判定
  it('timeLabel が1件もなければ false を返す', () => {
    // Arrange
    const dates = [makeDate([]), makeDate([])];
    const { hasAnyTimeLabel } = setupWithDates(dates);

    // Act
    const result = hasAnyTimeLabel.value;

    // Assert
    expect(result).toBe(false);
  });

  it('timeLabel が1件でもあれば true を返す', () => {
    // Arrange
    const dates = [makeDate([]), makeDate([], { timeLabel: '13:00〜' })];
    const { hasAnyTimeLabel } = setupWithDates(dates);

    // Act
    const result = hasAnyTimeLabel.value;

    // Assert
    expect(result).toBe(true);
  });

  it('空文字の timeLabel は書かれていない扱いにする', () => {
    // Arrange
    const dates = [makeDate([], { timeLabel: '' })];
    const { hasAnyTimeLabel } = setupWithDates(dates);

    // Act
    const result = hasAnyTimeLabel.value;

    // Assert
    expect(result).toBe(false);
  });

  it('候補日が空なら false を返す', () => {
    // Arrange
    const dates: CandidateDateModel[] = [];
    const { hasAnyTimeLabel } = setupWithDates(dates);

    // Act
    const result = hasAnyTimeLabel.value;

    // Assert
    expect(result).toBe(false);
  });
});
