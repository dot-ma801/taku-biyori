import { describe, expect, it, vi } from 'vitest';
import { upsertGuestScheduleAnswers } from '@/lobby/application/upsert-guest-schedule-answers';
import type { UpsertGuestScheduleAnswersRepository } from '@/lobby/application/upsert-guest-schedule-answers';
import type { LobbyScheduleAnswer } from '@taku-biyori/shared';

const TOKEN = 'guest-token-abc';

const mockAnswers: LobbyScheduleAnswer[] = [
  { id: 'answer-1', entryId: 'entry-guest', answer: 'ok', comment: null },
];

const makeRepo = (
  overrides: Partial<UpsertGuestScheduleAnswersRepository> = {},
): UpsertGuestScheduleAnswersRepository => {
  const repo: UpsertGuestScheduleAnswersRepository = {
    findGuestLinkToken: vi.fn().mockResolvedValue(TOKEN),
    findStatusFields: vi.fn().mockResolvedValue({
      publishedAt: new Date('2026-08-01T00:00:00.000Z'),
      openUntil: null,
      receptionClosedAt: null,
      disbandedAt: null,
    }),
    findSchedulePollLobbyId: vi.fn().mockResolvedValue('lobby-1'),
    findLatestSchedulePollId: vi.fn().mockResolvedValue('poll-1'),
    isGuestEntry: vi.fn().mockResolvedValue(true),
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
  repo: UpsertGuestScheduleAnswersRepository,
  opts: {
    lobbyId?: string;
    pollId?: string;
    token?: string;
    entryId?: string;
  } = {},
) =>
  upsertGuestScheduleAnswers(
    repo,
    opts.lobbyId ?? 'lobby-1',
    opts.pollId ?? 'poll-1',
    opts.token ?? TOKEN,
    {
      entryId: opts.entryId ?? 'entry-guest',
      answers: [{ candidateDateId: 'date-1', answer: 'ok' }],
    },
  );

describe('upsertGuestScheduleAnswers', () => {
  describe('ロックの範囲', () => {
    it('最新判定・候補日の検証・回答の書き込みを `executeWithLock` の中でまとめて行う', async () => {
      // Arrange
      const repo = makeRepo();

      // Act
      await act(repo);

      // Assert
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

  it('トークン一致かつゲストメンバーならまとめて回答できる', async () => {
    // Arrange
    const repo = makeRepo();

    // Act
    const result = await act(repo);

    // Assert
    expect(result).toEqual({ type: 'ok', answers: mockAnswers });
  });

  it('ロビーが存在しない場合は notFound を返す', async () => {
    // Arrange
    const repo = makeRepo({
      findGuestLinkToken: vi.fn().mockResolvedValue(null),
      findStatusFields: vi.fn().mockResolvedValue(null),
    });

    // Act
    const result = await act(repo);

    // Assert
    expect(result).toEqual({ type: 'notFound' });
  });

  it('ロビーは存在するがゲストリンクトークンが未設定の場合は invalidToken を返す', async () => {
    // Arrange
    const repo = makeRepo({
      findGuestLinkToken: vi.fn().mockResolvedValue(null),
    });

    // Act
    const result = await act(repo);

    // Assert
    expect(result).toEqual({ type: 'invalidToken' });
  });

  it('トークンが一致しない場合は invalidToken を返す', async () => {
    // Arrange
    const repo = makeRepo();

    // Act
    const result = await act(repo, { token: 'wrong-token' });

    // Assert
    expect(result).toEqual({ type: 'invalidToken' });
  });

  it('draft のロビーは invalidStatus を返す（ゲストは notPublished を区別しない）', async () => {
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
    expect(result).toEqual({ type: 'invalidStatus' });
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

  it('指定 entryId がゲストメンバーでない場合は forbidden を返す', async () => {
    // Arrange
    const repo = makeRepo({
      isGuestEntry: vi.fn().mockResolvedValue(false),
    });

    // Act
    const result = await act(repo, { entryId: 'entry-logged-in' });

    // Assert
    expect(result).toEqual({ type: 'forbidden' });
  });

  it('この調整に属さない候補日IDが1件でも含まれると notFound を返す', async () => {
    // Arrange
    const upsertScheduleAnswersFn = vi.fn().mockResolvedValue(mockAnswers);
    const repo = makeRepo({
      findCandidateDateIdsByPollId: vi.fn().mockResolvedValue(['date-1']),
      upsertScheduleAnswers: upsertScheduleAnswersFn,
    });

    // Act
    const result = await upsertGuestScheduleAnswers(
      repo,
      'lobby-1',
      'poll-1',
      TOKEN,
      {
        entryId: 'entry-guest',
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
    await upsertGuestScheduleAnswers(repo, 'lobby-1', 'poll-1', TOKEN, {
      entryId: 'entry-guest',
      answers: [
        { candidateDateId: 'date-1', answer: 'ok' },
        { candidateDateId: 'date-2', answer: 'maybe', comment: 'たぶん行ける' },
      ],
    });

    // Assert
    expect(upsertScheduleAnswersFn).toHaveBeenCalledWith('entry-guest', [
      { candidateDateId: 'date-1', answer: 'ok' },
      { candidateDateId: 'date-2', answer: 'maybe', comment: 'たぶん行ける' },
    ]);
  });
});
