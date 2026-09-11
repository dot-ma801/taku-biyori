import { describe, expect, it, vi } from 'vitest';
import { replaceCandidateDates } from '@/lobby/application/replace-candidate-dates';
import type { ReplaceCandidateDatesRepository } from '@/lobby/application/replace-candidate-dates';
import type { LobbyCandidateDate } from '@taku-biyori/shared';

const existingDates: LobbyCandidateDate[] = [
  { id: 'date-1', date: '2100-09-01', timeLabel: null },
  { id: 'date-2', date: '2100-09-02', timeLabel: null },
];

// makeRepo:
// `executeWithLock` のモックは「コールバックを同期的にそのまま実行する」スタブを既定とする。
// 実 DB ではここでトランザクション境界 + 行ロックが張られるが、ユニットテストでは
// application 層の判定ロジックが lockedRepo 経由で正しく走ることだけ検証したい
// （読み取りと書き込みをまたぐ既存ユースケースと同方針）。
const makeRepo = (
  overrides: Partial<ReplaceCandidateDatesRepository> = {},
): ReplaceCandidateDatesRepository => {
  const repo: ReplaceCandidateDatesRepository = {
    findHostUserId: vi.fn().mockResolvedValue('user-1'),
    findStatusFields: vi.fn().mockResolvedValue({
      publishedAt: new Date('2026-08-01T00:00:00.000Z'),
      openUntil: null,
      receptionClosedAt: null,
      disbandedAt: null,
    }),
    findSchedulePollLobbyId: vi.fn().mockResolvedValue('lobby-1'),
    findLatestSchedulePollId: vi.fn().mockResolvedValue('poll-1'),
    findCandidateDatesByPollId: vi.fn().mockResolvedValue(existingDates),
    applyCandidateDateChanges: vi.fn().mockResolvedValue(undefined),
    executeWithLock: vi.fn(async (_id, fn) => fn(repo)),
    ...overrides,
  };
  return repo;
};

describe('replaceCandidateDates', () => {
  it('ホストが候補日を差し替えでき、更新後の一覧を返す', async () => {
    // Arrange
    const updatedDates: LobbyCandidateDate[] = [
      ...existingDates,
      { id: 'date-3', date: '2100-09-03', timeLabel: null },
    ];
    const findCandidateDatesByPollId = vi
      .fn()
      .mockResolvedValueOnce(existingDates) // 差分計算用
      .mockResolvedValueOnce(updatedDates); // 更新後の返却用
    const repo = makeRepo({ findCandidateDatesByPollId });

    // Act
    const result = await replaceCandidateDates(
      repo,
      'lobby-1',
      'poll-1',
      'user-1',
      {
        candidateDates: [
          { date: '2100-09-01' },
          { date: '2100-09-02' },
          { date: '2100-09-03' },
        ],
      },
    );

    // Assert
    expect(result).toEqual({ type: 'ok', dates: updatedDates });
  });

  it('残る日付は削除対象にせず、追加分と削除分だけを applyCandidateDateChanges に渡す', async () => {
    // Arrange
    const applyCandidateDateChanges = vi.fn().mockResolvedValue(undefined);
    const repo = makeRepo({ applyCandidateDateChanges });

    // Act
    // date-1 (2100-09-01) は残し、date-2 (2100-09-02) を消して 2100-09-05 を足す
    await replaceCandidateDates(repo, 'lobby-1', 'poll-1', 'user-1', {
      candidateDates: [{ date: '2100-09-01' }, { date: '2100-09-05' }],
    });

    // Assert
    expect(applyCandidateDateChanges).toHaveBeenCalledWith('poll-1', {
      datesToAdd: [{ date: '2100-09-05', timeLabel: null }],
      dateIdsToRemove: ['date-2'],
      timeLabelsToUpdate: [],
    });
  });

  it('既存と同じ内容なら書き込みを行わない', async () => {
    // Arrange
    const applyCandidateDateChanges = vi.fn().mockResolvedValue(undefined);
    const repo = makeRepo({ applyCandidateDateChanges });

    // Act
    const result = await replaceCandidateDates(
      repo,
      'lobby-1',
      'poll-1',
      'user-1',
      {
        candidateDates: [{ date: '2100-09-01' }, { date: '2100-09-02' }],
      },
    );

    // Assert
    expect(applyCandidateDateChanges).not.toHaveBeenCalled();
    expect(result).toEqual({ type: 'ok', dates: existingDates });
  });

  it('時間帯だけ変わった行は timeLabelsToUpdate として渡る', async () => {
    // Arrange
    const applyCandidateDateChanges = vi.fn().mockResolvedValue(undefined);
    const repo = makeRepo({ applyCandidateDateChanges });

    // Act
    await replaceCandidateDates(repo, 'lobby-1', 'poll-1', 'user-1', {
      candidateDates: [
        { date: '2100-09-01', timeLabel: '13:00〜17:00' },
        { date: '2100-09-02' },
      ],
    });

    // Assert
    expect(applyCandidateDateChanges).toHaveBeenCalledWith('poll-1', {
      datesToAdd: [],
      dateIdsToRemove: [],
      timeLabelsToUpdate: [{ id: 'date-1', timeLabel: '13:00〜17:00' }],
    });
  });

  it('存在しないロビーIDは notFound を返す', async () => {
    // Arrange
    const repo = makeRepo({ findHostUserId: vi.fn().mockResolvedValue(null) });

    // Act
    const result = await replaceCandidateDates(
      repo,
      'nonexistent',
      'poll-1',
      'user-1',
      { candidateDates: [{ date: '2100-09-01' }] },
    );

    // Assert
    expect(result).toEqual({ type: 'notFound' });
  });

  it('ホスト以外は forbidden を返し、書き込みを行わない', async () => {
    // Arrange
    const applyCandidateDateChanges = vi.fn().mockResolvedValue(undefined);
    const repo = makeRepo({
      findHostUserId: vi.fn().mockResolvedValue('other-user'),
      applyCandidateDateChanges,
    });

    // Act
    const result = await replaceCandidateDates(
      repo,
      'lobby-1',
      'poll-1',
      'user-1',
      { candidateDates: [{ date: '2100-09-01' }] },
    );

    // Assert
    expect(result).toEqual({ type: 'forbidden' });
    expect(applyCandidateDateChanges).not.toHaveBeenCalled();
  });

  it('ロビーが存在しない場合（status も notFound）は notFound を返す', async () => {
    // Arrange
    const repo = makeRepo({
      findStatusFields: vi.fn().mockResolvedValue(null),
    });

    // Act
    const result = await replaceCandidateDates(
      repo,
      'lobby-1',
      'poll-1',
      'user-1',
      { candidateDates: [{ date: '2100-09-01' }] },
    );

    // Assert
    expect(result).toEqual({ type: 'notFound' });
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
    const result = await replaceCandidateDates(
      repo,
      'lobby-1',
      'poll-1',
      'user-1',
      { candidateDates: [{ date: '2100-09-01' }] },
    );

    // Assert
    expect(result).toEqual({ type: 'invalidStatus' });
  });

  it('存在しない調整IDは notFound を返す', async () => {
    // Arrange
    const repo = makeRepo({
      findSchedulePollLobbyId: vi.fn().mockResolvedValue(null),
    });

    // Act
    const result = await replaceCandidateDates(
      repo,
      'lobby-1',
      'nonexistent',
      'user-1',
      { candidateDates: [{ date: '2100-09-01' }] },
    );

    // Assert
    expect(result).toEqual({ type: 'notFound' });
  });

  it('調整が別ロビーに属する場合は notFound を返す', async () => {
    // Arrange
    const repo = makeRepo({
      findSchedulePollLobbyId: vi.fn().mockResolvedValue('other-lobby'),
    });

    // Act
    const result = await replaceCandidateDates(
      repo,
      'lobby-1',
      'poll-1',
      'user-1',
      { candidateDates: [{ date: '2100-09-01' }] },
    );

    // Assert
    expect(result).toEqual({ type: 'notFound' });
  });

  it('最新でない調整を編集しようとすると notLatest を返す', async () => {
    // Arrange
    const applyCandidateDateChanges = vi.fn().mockResolvedValue(undefined);
    const repo = makeRepo({
      findLatestSchedulePollId: vi.fn().mockResolvedValue('poll-2'),
      applyCandidateDateChanges,
    });

    // Act
    const result = await replaceCandidateDates(
      repo,
      'lobby-1',
      'poll-1',
      'user-1',
      { candidateDates: [{ date: '2100-09-01' }] },
    );

    // Assert
    expect(result).toEqual({ type: 'notLatest' });
    expect(applyCandidateDateChanges).not.toHaveBeenCalled();
  });

  describe('過去日ルール', () => {
    it('既存にない過去日を追加しようとすると pastDateAdded を返す', async () => {
      // Arrange
      const applyCandidateDateChanges = vi.fn().mockResolvedValue(undefined);
      const repo = makeRepo({ applyCandidateDateChanges });

      // Act
      const result = await replaceCandidateDates(
        repo,
        'lobby-1',
        'poll-1',
        'user-1',
        {
          candidateDates: [
            { date: '2100-09-01' },
            { date: '2020-01-01' }, // 既存に無い過去日
          ],
        },
      );

      // Assert
      expect(result).toEqual({ type: 'pastDateAdded' });
      expect(applyCandidateDateChanges).not.toHaveBeenCalled();
    });

    it('既存の過去日はそのまま据え置ける（削除対象にならない）', async () => {
      // Arrange
      const pastExisting: LobbyCandidateDate[] = [
        { id: 'date-past', date: '2020-01-01', timeLabel: null },
      ];
      const applyCandidateDateChanges = vi.fn().mockResolvedValue(undefined);
      const repo = makeRepo({
        findCandidateDatesByPollId: vi.fn().mockResolvedValue(pastExisting),
        applyCandidateDateChanges,
      });

      // Act
      const result = await replaceCandidateDates(
        repo,
        'lobby-1',
        'poll-1',
        'user-1',
        { candidateDates: [{ date: '2020-01-01' }] },
      );

      // Assert
      expect(result).toEqual({ type: 'ok', dates: pastExisting });
      expect(applyCandidateDateChanges).not.toHaveBeenCalled();
    });

    it('既存の過去日は時間帯の変更を許す', async () => {
      // Arrange
      const pastExisting: LobbyCandidateDate[] = [
        { id: 'date-past', date: '2020-01-01', timeLabel: null },
      ];
      const applyCandidateDateChanges = vi.fn().mockResolvedValue(undefined);
      const repo = makeRepo({
        findCandidateDatesByPollId: vi.fn().mockResolvedValue(pastExisting),
        applyCandidateDateChanges,
      });

      // Act
      const result = await replaceCandidateDates(
        repo,
        'lobby-1',
        'poll-1',
        'user-1',
        { candidateDates: [{ date: '2020-01-01', timeLabel: '午後から' }] },
      );

      // Assert
      expect(result).not.toEqual({ type: 'pastDateAdded' });
      expect(applyCandidateDateChanges).toHaveBeenCalledWith('poll-1', {
        datesToAdd: [],
        dateIdsToRemove: [],
        timeLabelsToUpdate: [{ id: 'date-past', timeLabel: '午後から' }],
      });
    });
  });

  describe('TOCTOU 対策（トランザクション + 行ロック）', () => {
    it('読み取りから書き込みまでを `executeWithLock` の中で 1 回のスコープにまとめる', async () => {
      // Arrange
      const repo = makeRepo();

      // Act
      await replaceCandidateDates(repo, 'lobby-1', 'poll-1', 'user-1', {
        candidateDates: [{ date: '2100-09-01' }, { date: '2100-09-05' }],
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
      const result = await replaceCandidateDates(
        repo,
        'lobby-1',
        'poll-1',
        'user-1',
        { candidateDates: [{ date: '2100-09-01' }] },
      );

      // Assert
      expect(result).toEqual({ type: 'notFound' });
      expect(repo.findHostUserId).not.toHaveBeenCalled();
      expect(repo.findCandidateDatesByPollId).not.toHaveBeenCalled();
      expect(repo.applyCandidateDateChanges).not.toHaveBeenCalled();
    });
  });
});
