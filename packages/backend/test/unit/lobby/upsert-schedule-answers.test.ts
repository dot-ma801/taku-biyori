import { describe, expect, it, vi } from 'vitest';
import { upsertScheduleAnswers } from '@/lobby/application/upsert-schedule-answers';
import type { UpsertScheduleAnswersRepository } from '@/lobby/application/upsert-schedule-answers';
import type { LobbyScheduleAnswer } from '@taku-biyori/shared';

const mockAnswers: LobbyScheduleAnswer[] = [
  { id: 'answer-1', entryId: 'entry-1', answer: 'ok', comment: null },
];

const makeRepo = (
  overrides: Partial<UpsertScheduleAnswersRepository> = {},
): UpsertScheduleAnswersRepository => {
  const repo: UpsertScheduleAnswersRepository = {
    findStatusFields: vi.fn().mockResolvedValue({
      publishedAt: new Date('2026-08-01T00:00:00.000Z'),
      openUntil: null,
      receptionClosedAt: null,
      disbandedAt: null,
    }),
    findSchedulePollLobbyId: vi.fn().mockResolvedValue('lobby-1'),
    findLatestSchedulePollId: vi.fn().mockResolvedValue('poll-1'),
    findActiveEntryByUserId: vi.fn().mockResolvedValue('entry-1'),
    findCandidateDateIdsByPollId: vi
      .fn()
      .mockResolvedValue(['date-1', 'date-2']),
    upsertScheduleAnswers: vi.fn().mockResolvedValue(mockAnswers),
    // ロックの中で同じ repo を使う。並行性そのものは実 DB のテストで検証する
    executeWithLock: vi.fn(async (_lobbyId, fn) => fn(repo)),
    ...overrides,
  };
  return repo;
};

const act = (
  repo: UpsertScheduleAnswersRepository,
  opts: { lobbyId?: string; pollId?: string; userId?: string } = {},
) =>
  upsertScheduleAnswers(
    repo,
    opts.lobbyId ?? 'lobby-1',
    opts.pollId ?? 'poll-1',
    opts.userId ?? 'user-1',
    { answers: [{ candidateDateId: 'date-1', answer: 'ok' }] },
  );

describe('upsertScheduleAnswers', () => {
  describe('ロックの範囲', () => {
    it('最新判定・候補日の検証・回答の書き込みを `executeWithLock` の中でまとめて行う', async () => {
      // Arrange
      const repo = makeRepo();

      // Act
      await act(repo);

      // Assert
      // 判定と書き込みが別トランザクションに分かれると、判定のあとに新しい調整が
      // 作られて古い調整へ書き込めてしまう。1スコープに収まっていることを固定する
      expect(repo.executeWithLock).toHaveBeenCalledTimes(1);
      expect(repo.findLatestSchedulePollId).toHaveBeenCalled();
      expect(repo.upsertScheduleAnswers).toHaveBeenCalled();
    });

    it('ロックを取らずに回答を書き込まない', async () => {
      // Arrange
      const upsert = vi.fn().mockResolvedValue(mockAnswers);
      const repo = makeRepo({
        upsertScheduleAnswers: upsert,
        executeWithLock: vi.fn().mockResolvedValue({ type: 'notFound' }),
      });

      // Act
      const result = await act(repo);

      // Assert
      expect(result).toEqual({ type: 'notFound' });
      expect(upsert).not.toHaveBeenCalled();
    });
  });

  it('在籍中メンバーが自分の回答をまとめて登録できる', async () => {
    // Arrange
    const repo = makeRepo();

    // Act
    const result = await act(repo);

    // Assert
    expect(result).toEqual({ type: 'ok', answers: mockAnswers });
  });

  it('存在しないロビーIDは notFound を返す', async () => {
    // Arrange
    const repo = makeRepo({
      findStatusFields: vi.fn().mockResolvedValue(null),
    });

    // Act
    const result = await act(repo, { lobbyId: 'nonexistent' });

    // Assert
    expect(result).toEqual({ type: 'notFound' });
  });

  it('存在しない調整IDは notFound を返す', async () => {
    // Arrange
    const repo = makeRepo({
      findSchedulePollLobbyId: vi.fn().mockResolvedValue(null),
    });

    // Act
    const result = await act(repo, { pollId: 'nonexistent' });

    // Assert
    expect(result).toEqual({ type: 'notFound' });
  });

  it('調整が別ロビーに属する場合は notFound を返す', async () => {
    // Arrange
    const repo = makeRepo({
      findSchedulePollLobbyId: vi.fn().mockResolvedValue('other-lobby'),
    });

    // Act
    const result = await act(repo);

    // Assert
    expect(result).toEqual({ type: 'notFound' });
  });

  it('最新でない調整への回答は notLatest を返す', async () => {
    // Arrange
    const upsertScheduleAnswersFn = vi.fn().mockResolvedValue(mockAnswers);
    const repo = makeRepo({
      findLatestSchedulePollId: vi.fn().mockResolvedValue('poll-2'),
      upsertScheduleAnswers: upsertScheduleAnswersFn,
    });

    // Act
    const result = await act(repo);

    // Assert
    expect(result).toEqual({ type: 'notLatest' });
    expect(upsertScheduleAnswersFn).not.toHaveBeenCalled();
  });

  it('脱退済み・未参加のユーザーは forbidden を返す', async () => {
    // Arrange
    const repo = makeRepo({
      findActiveEntryByUserId: vi.fn().mockResolvedValue(null),
    });

    // Act
    const result = await act(repo);

    // Assert
    expect(result).toEqual({ type: 'forbidden' });
  });

  it('draft のロビーは notPublished を返す（公開前は回答できない）', async () => {
    // Arrange
    const repo = makeRepo({
      findStatusFields: vi.fn().mockResolvedValue({
        publishedAt: null,
        openUntil: null,
        receptionClosedAt: null,
        disbandedAt: null,
      }),
    });

    // Act
    const result = await act(repo);

    // Assert
    expect(result).toEqual({ type: 'notPublished' });
  });

  it('closed（受付終了）のロビーでも回答できる', async () => {
    // Arrange
    const repo = makeRepo({
      findStatusFields: vi.fn().mockResolvedValue({
        publishedAt: new Date('2026-08-01T00:00:00.000Z'),
        openUntil: '2020-01-01',
        receptionClosedAt: null,
        disbandedAt: null,
      }),
    });

    // Act
    const result = await act(repo);

    // Assert
    expect(result).toEqual({ type: 'ok', answers: mockAnswers });
  });

  it('disbanded のロビーは invalidStatus を返す', async () => {
    // Arrange
    const repo = makeRepo({
      findStatusFields: vi.fn().mockResolvedValue({
        publishedAt: new Date('2026-08-01T00:00:00.000Z'),
        openUntil: null,
        receptionClosedAt: null,
        disbandedAt: new Date('2026-08-15T00:00:00.000Z'),
      }),
    });

    // Act
    const result = await act(repo);

    // Assert
    expect(result).toEqual({ type: 'invalidStatus' });
  });

  it('この調整に属さない候補日IDが1件でも含まれると notFound を返す', async () => {
    // Arrange
    const upsertScheduleAnswersFn = vi.fn().mockResolvedValue(mockAnswers);
    const repo = makeRepo({
      findCandidateDateIdsByPollId: vi.fn().mockResolvedValue(['date-1']),
      upsertScheduleAnswers: upsertScheduleAnswersFn,
    });

    // Act
    const result = await upsertScheduleAnswers(
      repo,
      'lobby-1',
      'poll-1',
      'user-1',
      {
        answers: [
          { candidateDateId: 'date-1', answer: 'ok' },
          { candidateDateId: 'date-99', answer: 'maybe' },
        ],
      },
    );

    // Assert
    expect(result).toEqual({ type: 'notFound' });
    expect(upsertScheduleAnswersFn).not.toHaveBeenCalled();
  });

  it('upsertScheduleAnswers に entryId と送った回答一覧を渡す', async () => {
    // Arrange
    const upsertScheduleAnswersFn = vi.fn().mockResolvedValue(mockAnswers);
    const repo = makeRepo({ upsertScheduleAnswers: upsertScheduleAnswersFn });

    // Act
    await upsertScheduleAnswers(repo, 'lobby-1', 'poll-1', 'user-1', {
      answers: [
        { candidateDateId: 'date-1', answer: 'ok' },
        { candidateDateId: 'date-2', answer: 'maybe', comment: 'たぶん行ける' },
      ],
    });

    // Assert
    expect(upsertScheduleAnswersFn).toHaveBeenCalledWith('entry-1', [
      { candidateDateId: 'date-1', answer: 'ok' },
      { candidateDateId: 'date-2', answer: 'maybe', comment: 'たぶん行ける' },
    ]);
  });
});
