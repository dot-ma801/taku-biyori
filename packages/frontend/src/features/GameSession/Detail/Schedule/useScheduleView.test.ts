import { describe, it, expect } from 'vitest';
import { ref } from 'vue';
import type { AvailabilityDate, GameSessionMember } from '@taku-biyori/shared';
import { useScheduleView } from '@/features/GameSession/Detail/Schedule/useScheduleView';
import type { Answer } from '@/features/GameSession/Detail/Schedule/types';

const MEMBER_A = 'member-a';
const MEMBER_B = 'member-b';
const MEMBER_C = 'member-c';
const DATE_ID = 'date-1';

function makeMember(id: string): GameSessionMember {
  return {
    id,
    userId: null,
    userName: null,
    guestName: id,
    characterName: null,
    joinedAt: '2026-01-01T00:00:00Z',
  };
}

function makeDate(
  answers: { memberId: string; answer: Answer }[],
): AvailabilityDate {
  return {
    id: DATE_ID,
    date: '2026-06-02',
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
