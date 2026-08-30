import { describe, expect, it } from 'vitest';
import type {
  LobbyCandidateDate,
  LobbyCandidateDateWithAnswers,
  LobbySchedulePoll,
  LobbySchedulePollSummary,
} from '@taku-biyori/shared';
import {
  toCandidateDateModel,
  toReplacedCandidateDateModel,
  toSchedulePollModel,
  toSchedulePollSummaryModel,
} from '@/models/schedule-poll';

const answerDto = {
  id: '11111111-1111-1111-1111-111111111111',
  entryId: '22222222-2222-2222-2222-222222222222',
  answer: 'ok' as const,
  comment: '19時から参加できます',
};

const candidateDateDto: LobbyCandidateDateWithAnswers = {
  id: '33333333-3333-3333-3333-333333333333',
  date: '2026-09-05',
  timeLabel: '19:00〜',
  answers: [answerDto],
};

describe('toCandidateDateModel', () => {
  it('id・date・timeLabel をそのまま引き継ぐ', () => {
    // Arrange / Act
    const model = toCandidateDateModel(candidateDateDto);

    // Assert
    expect(model).toMatchObject({
      id: candidateDateDto.id,
      date: '2026-09-05',
      timeLabel: '19:00〜',
    });
  });

  it('date は YYYY-MM-DD の文字列のまま持つ（タイムゾーンでずれないように Date にしない）', () => {
    // Arrange / Act
    const model = toCandidateDateModel(candidateDateDto);

    // Assert
    expect(typeof model.date).toBe('string');
    expect(model.date).toBe('2026-09-05');
  });

  it('answers を entryId をキーにした Map に変換する', () => {
    // Arrange / Act
    const model = toCandidateDateModel(candidateDateDto);

    // Assert
    expect(model.answersByEntryId).toBeInstanceOf(Map);
    expect(model.answersByEntryId.get(answerDto.entryId)).toMatchObject({
      id: answerDto.id,
      answer: 'ok',
      comment: '19時から参加できます',
    });
  });

  it('回答が無い entryId は Map から引くと undefined になる', () => {
    // Arrange / Act
    const model = toCandidateDateModel(candidateDateDto);

    // Assert
    expect(model.answersByEntryId.get('存在しない-entry-id')).toBeUndefined();
  });

  it('comment が省略された回答は null に正規化する', () => {
    // Arrange
    const dto: LobbyCandidateDateWithAnswers = {
      ...candidateDateDto,
      answers: [{ ...answerDto, comment: undefined }],
    };

    // Act
    const model = toCandidateDateModel(dto);

    // Assert
    expect(model.answersByEntryId.get(answerDto.entryId)?.comment).toBeNull();
  });

  it('timeLabel が null の候補日はそのまま null を持つ', () => {
    // Arrange
    const dto: LobbyCandidateDateWithAnswers = {
      ...candidateDateDto,
      timeLabel: null,
    };

    // Act
    const model = toCandidateDateModel(dto);

    // Assert
    expect(model.timeLabel).toBeNull();
  });
});

describe('toSchedulePollModel', () => {
  const pollDto: LobbySchedulePoll = {
    id: '44444444-4444-4444-4444-444444444444',
    lobbyId: '55555555-5555-5555-5555-555555555555',
    candidateDates: [candidateDateDto],
    createdAt: '2026-08-20T10:00:00.000Z',
  };

  it('createdAt を Date に変換する', () => {
    // Arrange / Act
    const model = toSchedulePollModel(pollDto);

    // Assert
    expect(model.createdAt).toEqual(new Date('2026-08-20T10:00:00.000Z'));
  });

  it('id・lobbyId をそのまま引き継ぐ', () => {
    // Arrange / Act
    const model = toSchedulePollModel(pollDto);

    // Assert
    expect(model).toMatchObject({
      id: pollDto.id,
      lobbyId: pollDto.lobbyId,
    });
  });

  it('candidateDates を model に変換する', () => {
    // Arrange / Act
    const model = toSchedulePollModel(pollDto);

    // Assert
    expect(model.candidateDates).toHaveLength(1);
    expect(model.candidateDates[0]?.id).toBe(candidateDateDto.id);
    expect(model.candidateDates[0]?.answersByEntryId).toBeInstanceOf(Map);
  });
});

describe('toReplacedCandidateDateModel', () => {
  const replacedDto: LobbyCandidateDate = {
    id: '77777777-7777-7777-7777-777777777777',
    date: '2026-09-06',
    timeLabel: null,
  };

  it('id・date・timeLabel をそのまま引き継ぐ', () => {
    // Arrange / Act
    const model = toReplacedCandidateDateModel(replacedDto);

    // Assert
    expect(model).toMatchObject({
      id: replacedDto.id,
      date: '2026-09-06',
      timeLabel: null,
    });
  });

  it('レスポンスに回答が含まれないため answersByEntryId は空の Map になる', () => {
    // Arrange / Act
    const model = toReplacedCandidateDateModel(replacedDto);

    // Assert
    expect(model.answersByEntryId).toBeInstanceOf(Map);
    expect(model.answersByEntryId.size).toBe(0);
  });
});

describe('toSchedulePollSummaryModel', () => {
  const summaryDto: LobbySchedulePollSummary = {
    id: '66666666-6666-6666-6666-666666666666',
    createdAt: '2026-08-21T00:00:00.000Z',
  };

  it('id をそのまま引き継ぐ', () => {
    // Arrange / Act
    const model = toSchedulePollSummaryModel(summaryDto);

    // Assert
    expect(model.id).toBe(summaryDto.id);
  });

  it('createdAt を Date に変換する', () => {
    // Arrange / Act
    const model = toSchedulePollSummaryModel(summaryDto);

    // Assert
    expect(model.createdAt).toEqual(new Date('2026-08-21T00:00:00.000Z'));
  });
});
