import { describe, expect, it, vi } from 'vitest';
import { bulkUpdateAvailabilityDates } from '@/lobby/application/bulk-update-availability-dates';
import type { BulkUpdateAvailabilityDatesRepository } from '@/lobby/application/bulk-update-availability-dates';
import type { LobbyAvailabilityDate } from '@taku-biyori/shared';

const existingDates: LobbyAvailabilityDate[] = [
  {
    id: 'date-1',
    date: '2025-10-01',
    dateNote: null,
    answers: [
      { id: 'answer-1', memberId: 'member-1', answer: 'ok', comment: null },
    ],
  },
  { id: 'date-2', date: '2025-10-02', dateNote: null, answers: [] },
];

// makeRepo:
// `executeWithLock` のモックは「コールバックを同期的にそのまま実行する」スタブを既定とする。
// 実 DB ではここでトランザクション境界 + 行ロックが張られるが、ユニットテストでは
// application 層の判定ロジックが lockedRepo 経由で正しく走ることだけ検証したいため
// トランザクションの中身は素通しで良い（既存 delete-lobby / confirm-lobby と同方針）。
const makeRepo = (
  overrides: Partial<BulkUpdateAvailabilityDatesRepository> = {},
): BulkUpdateAvailabilityDatesRepository => {
  const repo: BulkUpdateAvailabilityDatesRepository = {
    findHostUserId: vi.fn().mockResolvedValue('user-1'),
    findStatusFields: vi.fn().mockResolvedValue({
      isPublished: true,
      openUntil: null,
      cancelledAt: null,
    }),
    findByLobbyId: vi.fn().mockResolvedValue(existingDates),
    applyDateChanges: vi.fn().mockResolvedValue(undefined),
    executeWithLock: vi.fn(async (_id, fn) => fn(repo)),
    ...overrides,
  };
  return repo;
};

describe('bulkUpdateAvailabilityDates', () => {
  it('ホストが候補日を一括更新でき、更新後の一覧を返す', async () => {
    // Arrange
    const updatedDates: LobbyAvailabilityDate[] = [
      ...existingDates,
      { id: 'date-3', date: '2025-10-03', dateNote: null, answers: [] },
    ];
    const findByLobbyId = vi
      .fn()
      .mockResolvedValueOnce(existingDates) // 差分計算用
      .mockResolvedValueOnce(updatedDates); // 更新後の返却用
    const repo = makeRepo({ findByLobbyId });

    // Act
    const result = await bulkUpdateAvailabilityDates(
      repo,
      'lobby-1',
      'user-1',
      {
        dates: [
          { date: '2025-10-01' },
          { date: '2025-10-02' },
          { date: '2025-10-03' },
        ],
      },
    );

    // Assert
    expect(result).toEqual({ type: 'ok', dates: updatedDates });
  });

  it('残る日付は削除対象にせず、追加分と削除分だけを applyDateChanges に渡す', async () => {
    // Arrange
    const applyDateChanges = vi.fn().mockResolvedValue(undefined);
    const repo = makeRepo({ applyDateChanges });

    // Act
    // date-1 (2025-10-01) は残し、date-2 (2025-10-02) を消して 2025-10-05 を足す
    await bulkUpdateAvailabilityDates(repo, 'lobby-1', 'user-1', {
      dates: [{ date: '2025-10-01' }, { date: '2025-10-05' }],
    });

    // Assert
    expect(applyDateChanges).toHaveBeenCalledWith('lobby-1', {
      datesToAdd: [{ date: '2025-10-05', dateNote: null }],
      dateIdsToRemove: ['date-2'],
      notesToUpdate: [],
    });
  });

  it('既存と同じ内容なら書き込みを行わない', async () => {
    // Arrange
    const applyDateChanges = vi.fn().mockResolvedValue(undefined);
    const repo = makeRepo({ applyDateChanges });

    // Act
    const result = await bulkUpdateAvailabilityDates(
      repo,
      'lobby-1',
      'user-1',
      { dates: [{ date: '2025-10-01' }, { date: '2025-10-02' }] },
    );

    // Assert
    expect(applyDateChanges).not.toHaveBeenCalled();
    expect(result).toEqual({ type: 'ok', dates: existingDates });
  });

  it('残った候補日の回答が返却結果に保持される', async () => {
    // Arrange
    const afterUpdate: LobbyAvailabilityDate[] = [
      existingDates[0]!, // date-1 は回答付きのまま残る
      { id: 'date-3', date: '2025-10-03', dateNote: null, answers: [] },
    ];
    const findByLobbyId = vi
      .fn()
      .mockResolvedValueOnce(existingDates)
      .mockResolvedValueOnce(afterUpdate);
    const repo = makeRepo({ findByLobbyId });

    // Act
    const result = await bulkUpdateAvailabilityDates(
      repo,
      'lobby-1',
      'user-1',
      { dates: [{ date: '2025-10-01' }, { date: '2025-10-03' }] },
    );

    // Assert
    expect(result).toEqual({ type: 'ok', dates: afterUpdate });
    expect(afterUpdate[0]!.answers).toEqual([
      { id: 'answer-1', memberId: 'member-1', answer: 'ok', comment: null },
    ]);
  });

  describe('ひとこと（dateNote）', () => {
    it('日付は変えずひとことだけ足すと notesToUpdate として渡る', async () => {
      // Arrange
      const applyDateChanges = vi.fn().mockResolvedValue(undefined);
      const repo = makeRepo({ applyDateChanges });

      // Act
      await bulkUpdateAvailabilityDates(repo, 'lobby-1', 'user-1', {
        dates: [
          { date: '2025-10-01', dateNote: '13:00〜17:00' },
          { date: '2025-10-02' },
        ],
      });

      // Assert
      expect(applyDateChanges).toHaveBeenCalledWith('lobby-1', {
        datesToAdd: [],
        dateIdsToRemove: [],
        notesToUpdate: [{ id: 'date-1', dateNote: '13:00〜17:00' }],
      });
    });

    it('空白のみのひとことは null に正規化され、書き込みも発生しない', async () => {
      // Arrange
      const applyDateChanges = vi.fn().mockResolvedValue(undefined);
      const repo = makeRepo({ applyDateChanges });

      // Act
      const result = await bulkUpdateAvailabilityDates(
        repo,
        'lobby-1',
        'user-1',
        {
          dates: [
            { date: '2025-10-01', dateNote: '   ' },
            { date: '2025-10-02', dateNote: '' },
          ],
        },
      );

      // Assert
      expect(applyDateChanges).not.toHaveBeenCalled();
      expect(result).toEqual({ type: 'ok', dates: existingDates });
    });

    it('追加する候補日のひとことは前後の空白を落として渡る', async () => {
      // Arrange
      const applyDateChanges = vi.fn().mockResolvedValue(undefined);
      const repo = makeRepo({ applyDateChanges });

      // Act
      await bulkUpdateAvailabilityDates(repo, 'lobby-1', 'user-1', {
        dates: [
          { date: '2025-10-01' },
          { date: '2025-10-02' },
          { date: '2025-10-05', dateNote: '  午後から  ' },
        ],
      });

      // Assert
      expect(applyDateChanges).toHaveBeenCalledWith('lobby-1', {
        datesToAdd: [{ date: '2025-10-05', dateNote: '午後から' }],
        dateIdsToRemove: [],
        notesToUpdate: [],
      });
    });
  });

  it('存在しない募集枠IDは notFound を返す', async () => {
    // Arrange
    const repo = makeRepo({ findHostUserId: vi.fn().mockResolvedValue(null) });

    // Act
    const result = await bulkUpdateAvailabilityDates(
      repo,
      'nonexistent',
      'user-1',
      { dates: [{ date: '2025-10-01' }] },
    );

    // Assert
    expect(result).toEqual({ type: 'notFound' });
  });

  it('ホスト以外は forbidden を返し、書き込みを行わない', async () => {
    // Arrange
    const applyDateChanges = vi.fn().mockResolvedValue(undefined);
    const repo = makeRepo({
      findHostUserId: vi.fn().mockResolvedValue('other-user'),
      applyDateChanges,
    });

    // Act
    const result = await bulkUpdateAvailabilityDates(
      repo,
      'lobby-1',
      'user-1',
      { dates: [{ date: '2025-10-01' }] },
    );

    // Assert
    expect(result).toEqual({ type: 'forbidden' });
    expect(applyDateChanges).not.toHaveBeenCalled();
  });

  it('募集枠が中止済みの場合は invalidStatus を返す', async () => {
    // Arrange
    const repo = makeRepo({
      findStatusFields: vi.fn().mockResolvedValue({
        isPublished: true,
        openUntil: null,
        cancelledAt: new Date('2026-01-01'),
      }),
    });

    // Act
    const result = await bulkUpdateAvailabilityDates(
      repo,
      'lobby-1',
      'user-1',
      { dates: [{ date: '2026-07-01' }] },
    );

    // Assert
    expect(result).toEqual({ type: 'invalidStatus' });
  });

  describe('TOCTOU 対策（トランザクション + 行ロック）', () => {
    it('読み取りから書き込みまでを `executeWithLock` の中で 1 回のスコープにまとめる', async () => {
      // Arrange
      const repo = makeRepo();

      // Act
      await bulkUpdateAvailabilityDates(repo, 'lobby-1', 'user-1', {
        dates: [{ date: '2025-10-01' }, { date: '2025-10-05' }],
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
      const result = await bulkUpdateAvailabilityDates(
        repo,
        'lobby-1',
        'user-1',
        { dates: [{ date: '2025-10-01' }] },
      );

      // Assert
      expect(result).toEqual({ type: 'notFound' });
      expect(repo.findHostUserId).not.toHaveBeenCalled();
      expect(repo.findByLobbyId).not.toHaveBeenCalled();
      expect(repo.applyDateChanges).not.toHaveBeenCalled();
    });
  });
});
