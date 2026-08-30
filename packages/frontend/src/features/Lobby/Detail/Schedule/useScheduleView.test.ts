import { describe, it, expect } from 'vitest';
import { ref } from 'vue';
import type { LobbyAvailabilityDate } from '@taku-biyori/shared';
import type { LobbyEntryModel } from '@/models/lobby';
import { useScheduleView } from '@/features/Lobby/Detail/Schedule/useScheduleView';
import type { Answer } from '@/features/Lobby/Detail/Schedule/types';

const MEMBER_A = 'member-a';
const MEMBER_B = 'member-b';
const MEMBER_C = 'member-c';
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
  answers: { memberId: string; answer: Answer }[],
): LobbyAvailabilityDate {
  return {
    id: DATE_ID,
    date: '2026-06-02',
    dateNote: null,
    answers: answers.map((a, i) => ({
      id: `answer-${i}`,
      memberId: a.memberId,
      answer: a.answer,
      comment: null,
    })),
  };
}

function setup(
  editableMemberIds: string[] = [],
  draftAnswers: Map<string, Answer> = new Map(),
) {
  return useScheduleView(ref(editableMemberIds), ref(draftAnswers));
}

function setupWithDates(availabilityDates: LobbyAvailabilityDate[]) {
  return useScheduleView(
    ref<string[]>([]),
    ref(new Map<string, Answer>()),
    ref(availabilityDates),
  );
}

describe('getAnswer', () => {
  it('API の回答をそのまま返す', () => {
    // Arrange
    const date = makeDate([{ memberId: MEMBER_A, answer: 'ok' }]);
    const { getAnswer } = setup();

    // Act
    const result = getAnswer(date, MEMBER_A);

    // Assert
    expect(result).toBe('ok');
  });

  it('回答がないメンバーには null を返す', () => {
    // Arrange
    const date = makeDate([{ memberId: MEMBER_A, answer: 'ok' }]);
    const { getAnswer } = setup();

    // Act
    const result = getAnswer(date, MEMBER_B);

    // Assert
    expect(result).toBeNull();
  });

  it('編集可能なメンバーは draft を優先して返す', () => {
    // Arrange
    const date = makeDate([{ memberId: MEMBER_A, answer: 'ok' }]);
    const draft = new Map<string, Answer>([[`${MEMBER_A}::${DATE_ID}`, 'ng']]);
    const { getAnswer } = setup([MEMBER_A], draft);

    // Act
    const result = getAnswer(date, MEMBER_A);

    // Assert
    expect(result).toBe('ng');
  });

  it('編集可能でないメンバーの draft は無視する', () => {
    // Arrange
    const date = makeDate([{ memberId: MEMBER_A, answer: 'ok' }]);
    const draft = new Map<string, Answer>([[`${MEMBER_A}::${DATE_ID}`, 'ng']]);
    const { getAnswer } = setup([], draft);

    // Act
    const result = getAnswer(date, MEMBER_A);

    // Assert
    expect(result).toBe('ok');
  });

  it('editableMemberIds・draftAnswers を getter で渡しても最新値を参照する', () => {
    // Arrange
    const date = makeDate([{ memberId: MEMBER_A, answer: 'ok' }]);
    const editableMemberIds = ref<string[]>([]);
    const draftAnswers = ref<Map<string, Answer>>(new Map());
    const { getAnswer } = useScheduleView(
      () => editableMemberIds.value,
      () => draftAnswers.value,
    );

    // Act & Assert（draft 未反映時は API の値）
    expect(getAnswer(date, MEMBER_A)).toBe('ok');

    // Act: 編集可能にして draft を書き込む
    editableMemberIds.value = [MEMBER_A];
    draftAnswers.value = new Map([[`${MEMBER_A}::${DATE_ID}`, 'ng']]);

    // Assert
    expect(getAnswer(date, MEMBER_A)).toBe('ng');
  });
});

describe('okCount', () => {
  it('ok と回答したメンバー数を返す', () => {
    // Arrange
    const date = makeDate([
      { memberId: MEMBER_A, answer: 'ok' },
      { memberId: MEMBER_B, answer: 'maybe' },
      { memberId: MEMBER_C, answer: 'ok' },
    ]);
    const members = [MEMBER_A, MEMBER_B, MEMBER_C].map(makeMember);
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
      { memberId: MEMBER_A, answer: 'ok' },
      { memberId: MEMBER_B, answer: 'maybe' },
      { memberId: MEMBER_C, answer: 'ng' },
    ]);
    const members = [MEMBER_A, MEMBER_B, MEMBER_C].map(makeMember);
    const { answerCounts } = setup();

    // Act
    const result = answerCounts(date, members);

    // Assert
    expect(result).toEqual({ ok: 1, maybe: 1, ng: 1 });
  });

  it('未回答のメンバーはどのカウントにも含めない', () => {
    // Arrange
    const date = makeDate([{ memberId: MEMBER_A, answer: 'ok' }]);
    const members = [MEMBER_A, MEMBER_B, MEMBER_C].map(makeMember);
    const { answerCounts } = setup();

    // Act
    const result = answerCounts(date, members);

    // Assert
    expect(result).toEqual({ ok: 1, maybe: 0, ng: 0 });
  });

  it('編集可能なメンバーは draft を反映して集計する', () => {
    // Arrange
    const date = makeDate([
      { memberId: MEMBER_A, answer: 'ok' },
      { memberId: MEMBER_B, answer: 'ng' },
    ]);
    const draft = new Map<string, Answer>([
      [`${MEMBER_A}::${DATE_ID}`, 'maybe'],
    ]);
    const members = [MEMBER_A, MEMBER_B].map(makeMember);
    const { answerCounts } = setup([MEMBER_A], draft);

    // Act
    const result = answerCounts(date, members);

    // Assert
    expect(result).toEqual({ ok: 0, maybe: 1, ng: 1 });
  });
});

describe('hasAnyDateNote', () => {
  // ホストが1件も書いていなければ表にひとこと列を出さないための判定
  it('ひとことが1件もなければ false を返す', () => {
    // Arrange
    const dates = [makeDate([]), makeDate([])];
    const { hasAnyDateNote } = setupWithDates(dates);

    // Act
    const result = hasAnyDateNote.value;

    // Assert
    expect(result).toBe(false);
  });

  it('ひとことが1件でもあれば true を返す', () => {
    // Arrange
    const dates = [makeDate([]), { ...makeDate([]), dateNote: '13:00〜' }];
    const { hasAnyDateNote } = setupWithDates(dates);

    // Act
    const result = hasAnyDateNote.value;

    // Assert
    expect(result).toBe(true);
  });

  it('空文字のひとことは書かれていない扱いにする', () => {
    // Arrange
    const dates = [{ ...makeDate([]), dateNote: '' }];
    const { hasAnyDateNote } = setupWithDates(dates);

    // Act
    const result = hasAnyDateNote.value;

    // Assert
    expect(result).toBe(false);
  });

  it('候補日が空なら false を返す', () => {
    // Arrange
    const dates: LobbyAvailabilityDate[] = [];
    const { hasAnyDateNote } = setupWithDates(dates);

    // Act
    const result = hasAnyDateNote.value;

    // Assert
    expect(result).toBe(false);
  });
});
