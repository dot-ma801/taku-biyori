import { describe, expect, it, vi } from 'vitest';
import { createSchedulePoll } from '@/lobby/application/create-schedule-poll';
import type { CreateSchedulePollRepository } from '@/lobby/application/create-schedule-poll';
import type { LobbySchedulePoll } from '@taku-biyori/shared';

const mockPoll: LobbySchedulePoll = {
  id: 'poll-1',
  lobbyId: 'lobby-1',
  createdAt: '2026-08-30T00:00:00.000Z',
  candidateDates: [
    { id: 'date-1', date: '2026-09-01', timeLabel: null, answers: [] },
  ],
};

// makeRepo:
// `executeWithLock` のモックは「コールバックを同期的にそのまま実行する」スタブを既定とする。
// 実 DB ではここでトランザクション境界 + 行ロックが張られるが、ユニットテストでは
// application 層の判定ロジックが lockedRepo 経由で正しく走ることだけ検証したい
// （読み取りと書き込みをまたぐ既存ユースケースと同方針）。
const makeRepo = (
  overrides: Partial<CreateSchedulePollRepository> = {},
): CreateSchedulePollRepository => {
  const repo: CreateSchedulePollRepository = {
    findHostUserId: vi.fn().mockResolvedValue('user-1'),
    findStatusFields: vi.fn().mockResolvedValue({
      publishedAt: new Date('2026-08-01T00:00:00.000Z'),
      openUntil: null,
      receptionClosedAt: null,
      disbandedAt: null,
    }),
    createSchedulePollWithDates: vi.fn().mockResolvedValue(mockPoll),
    executeWithLock: vi.fn(async (_id, fn) => fn(repo)),
    ...overrides,
  };
  return repo;
};

describe('createSchedulePoll', () => {
  it('ホストが日程調整を新設でき、作成された調整を返す', async () => {
    // Arrange
    const repo = makeRepo();

    // Act
    const result = await createSchedulePoll(repo, 'lobby-1', 'user-1', {
      candidateDates: [{ date: '2026-09-01' }],
    });

    // Assert
    expect(result).toEqual({ type: 'ok', poll: mockPoll });
  });

  it('候補日の時間帯を正規化して createSchedulePollWithDates に渡す', async () => {
    // Arrange
    const createSchedulePollWithDates = vi.fn().mockResolvedValue(mockPoll);
    const repo = makeRepo({ createSchedulePollWithDates });

    // Act
    await createSchedulePoll(repo, 'lobby-1', 'user-1', {
      candidateDates: [
        { date: '2026-09-01', timeLabel: '  13:00〜17:00  ' },
        { date: '2026-09-02', timeLabel: '   ' },
        { date: '2026-09-03' },
      ],
    });

    // Assert
    expect(createSchedulePollWithDates).toHaveBeenCalledWith('lobby-1', [
      { date: '2026-09-01', timeLabel: '13:00〜17:00' },
      { date: '2026-09-02', timeLabel: null },
      { date: '2026-09-03', timeLabel: null },
    ]);
  });

  it('作成された調整の候補日の回答は必ず空配列で返る', async () => {
    // Arrange
    const repo = makeRepo();

    // Act
    const result = await createSchedulePoll(repo, 'lobby-1', 'user-1', {
      candidateDates: [{ date: '2026-09-01' }],
    });

    // Assert
    expect(result).toEqual({
      type: 'ok',
      poll: expect.objectContaining({
        candidateDates: [expect.objectContaining({ answers: [] })],
      }),
    });
  });

  it('存在しないロビーIDは notFound を返す', async () => {
    // Arrange
    const repo = makeRepo({ findHostUserId: vi.fn().mockResolvedValue(null) });

    // Act
    const result = await createSchedulePoll(repo, 'nonexistent', 'user-1', {
      candidateDates: [{ date: '2026-09-01' }],
    });

    // Assert
    expect(result).toEqual({ type: 'notFound' });
  });

  it('ホスト以外は forbidden を返し、書き込みを行わない', async () => {
    // Arrange
    const createSchedulePollWithDates = vi.fn().mockResolvedValue(mockPoll);
    const repo = makeRepo({
      findHostUserId: vi.fn().mockResolvedValue('other-user'),
      createSchedulePollWithDates,
    });

    // Act
    const result = await createSchedulePoll(repo, 'lobby-1', 'user-1', {
      candidateDates: [{ date: '2026-09-01' }],
    });

    // Assert
    expect(result).toEqual({ type: 'forbidden' });
    expect(createSchedulePollWithDates).not.toHaveBeenCalled();
  });

  it('ロビーが解散済みの場合は invalidStatus を返す', async () => {
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
    const result = await createSchedulePoll(repo, 'lobby-1', 'user-1', {
      candidateDates: [{ date: '2026-09-01' }],
    });

    // Assert
    expect(result).toEqual({ type: 'invalidStatus' });
  });

  it('draft のロビーでもホストは日程調整を始められる', async () => {
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
    const result = await createSchedulePoll(repo, 'lobby-1', 'user-1', {
      candidateDates: [{ date: '2026-09-01' }],
    });

    // Assert
    expect(result).toEqual({ type: 'ok', poll: mockPoll });
  });

  describe('TOCTOU 対策（トランザクション + 行ロック）', () => {
    it('読み取りから書き込みまでを `executeWithLock` の中で 1 回のスコープにまとめる', async () => {
      // Arrange
      const repo = makeRepo();

      // Act
      await createSchedulePoll(repo, 'lobby-1', 'user-1', {
        candidateDates: [{ date: '2026-09-01' }],
      });

      // Assert
      expect(repo.executeWithLock).toHaveBeenCalledTimes(1);
      expect(repo.executeWithLock).toHaveBeenCalledWith(
        'lobby-1',
        expect.any(Function),
      );
    });

    it('`executeWithLock` が返した結果をそのまま返す', async () => {
      // Arrange
      const repo = makeRepo({
        executeWithLock: vi.fn().mockResolvedValue({ type: 'notFound' }),
      });

      // Act
      const result = await createSchedulePoll(repo, 'lobby-1', 'user-1', {
        candidateDates: [{ date: '2026-09-01' }],
      });

      // Assert
      expect(result).toEqual({ type: 'notFound' });
      expect(repo.findHostUserId).not.toHaveBeenCalled();
      expect(repo.createSchedulePollWithDates).not.toHaveBeenCalled();
    });
  });
});
