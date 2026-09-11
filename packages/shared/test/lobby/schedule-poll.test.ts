import { afterEach, describe, expect, it, vi } from 'vitest';
import {
  CreateSchedulePollInputSchema,
  GuestUpsertScheduleAnswersInputSchema,
  LobbyCandidateDateSchema,
  LobbyCandidateDateWithAnswersSchema,
  LobbyScheduleAnswerSchema,
  LobbySchedulePollSchema,
  LobbySchedulePollSummarySchema,
  ReplaceCandidateDatesInputSchema,
  UpsertScheduleAnswersInputSchema,
} from '@/lobby';

afterEach(() => {
  vi.useRealTimers();
});

const candidateDateId = '11111111-1111-4111-8111-111111111111';
const entryId = '22222222-2222-4222-8222-222222222222';

describe('SchedulePoll のレスポンス契約', () => {
  it('要約を受け付ける', () => {
    // Arrange
    const input = {
      id: '33333333-3333-4333-8333-333333333333',
      createdAt: '2026-08-30T00:00:00.000Z',
    };

    // Act
    const result = LobbySchedulePollSummarySchema.safeParse(input);

    // Assert
    expect(result.success).toBe(true);
  });

  it('候補日と回答を受け付ける', () => {
    // Arrange
    const answer = {
      id: '44444444-4444-4444-8444-444444444444',
      entryId,
      answer: 'maybe',
      comment: '夜なら',
    };
    const candidateDate = {
      id: candidateDateId,
      date: '2026-09-13',
      timeLabel: '午後',
    };

    // Act
    const answerResult = LobbyScheduleAnswerSchema.safeParse(answer);
    const candidateDateResult =
      LobbyCandidateDateSchema.safeParse(candidateDate);
    const withAnswersResult = LobbyCandidateDateWithAnswersSchema.safeParse({
      ...candidateDate,
      answers: [answer],
    });
    const pollResult = LobbySchedulePollSchema.safeParse({
      id: '33333333-3333-4333-8333-333333333333',
      lobbyId: '55555555-5555-4555-8555-555555555555',
      candidateDates: [{ ...candidateDate, answers: [answer] }],
      createdAt: '2026-08-30T00:00:00.000Z',
    });

    // Assert
    expect(answerResult.success).toBe(true);
    expect(candidateDateResult.success).toBe(true);
    expect(withAnswersResult.success).toBe(true);
    expect(pollResult.success).toBe(true);
  });
});

describe('CreateSchedulePollInputSchema', () => {
  it('候補日と timeLabel を受け付け、timeLabel を正規化する', () => {
    // Arrange
    vi.setSystemTime(new Date('2026-08-30T00:00:00'));
    const input = {
      candidateDates: [{ date: '2026-08-30', timeLabel: '  午後  ' }],
    };

    // Act
    const result = CreateSchedulePollInputSchema.safeParse(input);

    // Assert
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.candidateDates[0]?.timeLabel).toBe('午後');
    }
  });

  it('候補日が空なら失敗する', () => {
    // Arrange
    const input = { candidateDates: [] };

    // Act
    const result = CreateSchedulePollInputSchema.safeParse(input);

    // Assert
    expect(result.success).toBe(false);
  });

  it('重複する日付を含むと失敗する', () => {
    // Arrange
    const input = {
      candidateDates: [{ date: '2099-01-01' }, { date: '2099-01-01' }],
    };

    // Act
    const result = CreateSchedulePollInputSchema.safeParse(input);

    // Assert
    expect(result.success).toBe(false);
  });

  it('過去日を含むと失敗する', () => {
    // Arrange
    vi.setSystemTime(new Date('2026-08-30T00:00:00'));
    const input = { candidateDates: [{ date: '2026-08-29' }] };

    // Act
    const result = CreateSchedulePollInputSchema.safeParse(input);

    // Assert
    expect(result.success).toBe(false);
  });
});

describe('ReplaceCandidateDatesInputSchema', () => {
  it('重複する日付を含むと失敗する', () => {
    // Arrange
    const input = {
      candidateDates: [{ date: '2099-01-01' }, { date: '2099-01-01' }],
    };

    // Act
    const result = ReplaceCandidateDatesInputSchema.safeParse(input);

    // Assert
    expect(result.success).toBe(false);
  });

  it('既存候補日の据え置き判定を backend に委ねるため過去日を受け付ける', () => {
    // Arrange
    vi.setSystemTime(new Date('2026-08-30T00:00:00'));
    const input = { candidateDates: [{ date: '2026-08-29' }] };

    // Act
    const result = ReplaceCandidateDatesInputSchema.safeParse(input);

    // Assert
    expect(result.success).toBe(true);
  });
});

describe('日程回答の入力契約', () => {
  it('ログインユーザーの回答を一括で受け付ける', () => {
    // Arrange
    const input = {
      answers: [{ candidateDateId, answer: 'ok', comment: null }],
    };

    // Act
    const result = UpsertScheduleAnswersInputSchema.safeParse(input);

    // Assert
    expect(result.success).toBe(true);
  });

  it('回答が空なら失敗する', () => {
    // Arrange
    const input = { answers: [] };

    // Act
    const result = UpsertScheduleAnswersInputSchema.safeParse(input);

    // Assert
    expect(result.success).toBe(false);
  });

  it('500文字を超えるコメントを拒否する', () => {
    // Arrange
    const input = {
      answers: [{ candidateDateId, answer: 'ng', comment: 'あ'.repeat(501) }],
    };

    // Act
    const result = UpsertScheduleAnswersInputSchema.safeParse(input);

    // Assert
    expect(result.success).toBe(false);
  });

  it('同じ候補日への回答が重複していたら失敗する', () => {
    // Arrange
    const input = {
      answers: [
        { candidateDateId, answer: 'ok' },
        { candidateDateId, answer: 'ng' },
      ],
    };

    // Act
    const result = UpsertScheduleAnswersInputSchema.safeParse(input);

    // Assert
    expect(result.success).toBe(false);
  });

  it('ゲストの回答でも候補日の重複を拒否する', () => {
    // Arrange
    const input = {
      entryId,
      answers: [
        { candidateDateId, answer: 'ok' },
        { candidateDateId, answer: 'maybe' },
      ],
    };

    // Act
    const result = GuestUpsertScheduleAnswersInputSchema.safeParse(input);

    // Assert
    expect(result.success).toBe(false);
  });

  it('ゲストの entryId と回答を受け付ける', () => {
    // Arrange
    const input = {
      entryId,
      answers: [{ candidateDateId, answer: 'maybe' }],
    };

    // Act
    const result = GuestUpsertScheduleAnswersInputSchema.safeParse(input);

    // Assert
    expect(result.success).toBe(true);
  });
});
