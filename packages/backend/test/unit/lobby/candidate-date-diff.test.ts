import { describe, expect, it } from 'vitest';
import { diffCandidateDates } from '@/lobby/domain/candidate-date-diff';
import type { ExistingCandidateDate } from '@/lobby/domain/candidate-date-diff';

describe('diffCandidateDates', () => {
  it('既存とリクエストが同じなら追加も削除も更新もない', () => {
    // Arrange
    const existing = [
      { id: 'date-1', date: '2026-08-01', timeNote: null },
      { id: 'date-2', date: '2026-08-02', timeNote: '午後から' },
    ];
    const requested = [
      { date: '2026-08-01' },
      { date: '2026-08-02', timeNote: '午後から' },
    ];

    // Act
    const result = diffCandidateDates(existing, requested);

    // Assert
    expect(result).toEqual({
      datesToAdd: [],
      dateIdsToRemove: [],
      notesToUpdate: [],
    });
  });

  it('リクエストにだけある日付は時刻メモごと追加対象になる', () => {
    // Arrange
    const existing = [{ id: 'date-1', date: '2026-08-01', timeNote: null }];
    const requested = [
      { date: '2026-08-01' },
      { date: '2026-08-02', timeNote: '夕方から' },
      { date: '2026-08-03' },
    ];

    // Act
    const result = diffCandidateDates(existing, requested);

    // Assert
    expect(result).toEqual({
      datesToAdd: [
        { date: '2026-08-02', timeNote: '夕方から' },
        { date: '2026-08-03', timeNote: null },
      ],
      dateIdsToRemove: [],
      notesToUpdate: [],
    });
  });

  it('既存にだけある日付はその ID が削除対象になる', () => {
    // Arrange
    const existing = [
      { id: 'date-1', date: '2026-08-01', timeNote: null },
      { id: 'date-2', date: '2026-08-02', timeNote: null },
      { id: 'date-3', date: '2026-08-03', timeNote: '終日OK' },
    ];
    const requested = [{ date: '2026-08-02' }];

    // Act
    const result = diffCandidateDates(existing, requested);

    // Assert
    expect(result).toEqual({
      datesToAdd: [],
      dateIdsToRemove: ['date-1', 'date-3'],
      notesToUpdate: [],
    });
  });

  it('追加と削除が混在してもそれぞれ正しく判定する（残る日付は触らない）', () => {
    // Arrange
    const existing = [
      { id: 'date-1', date: '2026-08-01', timeNote: null },
      { id: 'date-2', date: '2026-08-02', timeNote: null },
    ];
    const requested = [{ date: '2026-08-02' }, { date: '2026-08-05' }];

    // Act
    const result = diffCandidateDates(existing, requested);

    // Assert
    expect(result).toEqual({
      datesToAdd: [{ date: '2026-08-05', timeNote: null }],
      dateIdsToRemove: ['date-1'],
      notesToUpdate: [],
    });
  });

  it('既存が空ならリクエスト全件が追加対象になる', () => {
    // Arrange
    const existing: ExistingCandidateDate[] = [];
    const requested = [{ date: '2026-08-01' }];

    // Act
    const result = diffCandidateDates(existing, requested);

    // Assert
    expect(result).toEqual({
      datesToAdd: [{ date: '2026-08-01', timeNote: null }],
      dateIdsToRemove: [],
      notesToUpdate: [],
    });
  });

  it('リクエストに重複した日付があっても追加対象は1件に丸める（後勝ち）', () => {
    // Arrange
    const existing: ExistingCandidateDate[] = [];
    const requested = [
      { date: '2026-08-01' },
      { date: '2026-08-01', timeNote: '午後から' },
    ];

    // Act
    const result = diffCandidateDates(existing, requested);

    // Assert
    expect(result).toEqual({
      datesToAdd: [{ date: '2026-08-01', timeNote: '午後から' }],
      dateIdsToRemove: [],
      notesToUpdate: [],
    });
  });

  describe('時刻メモの更新', () => {
    // 日付が据え置きのまま時刻メモだけ変わった場合、行を作り直すと
    // その候補日に紐づく回答（◯△×）がカスケード削除で消えてしまう。
    // 必ず「更新」として扱い、追加・削除には含めないこと。
    it('時刻メモだけが変わった日付は更新対象になり、追加・削除には含まれない', () => {
      // Arrange
      const existing = [
        { id: 'date-1', date: '2026-08-01', timeNote: '午後から' },
      ];
      const requested = [{ date: '2026-08-01', timeNote: '19:00〜' }];

      // Act
      const result = diffCandidateDates(existing, requested);

      // Assert
      expect(result).toEqual({
        datesToAdd: [],
        dateIdsToRemove: [],
        notesToUpdate: [{ id: 'date-1', timeNote: '19:00〜' }],
      });
    });

    it('時刻メモが未入力から入力に変わった日付は更新対象になる', () => {
      // Arrange
      const existing = [{ id: 'date-1', date: '2026-08-01', timeNote: null }];
      const requested = [{ date: '2026-08-01', timeNote: '夕方から' }];

      // Act
      const result = diffCandidateDates(existing, requested);

      // Assert
      expect(result).toEqual({
        datesToAdd: [],
        dateIdsToRemove: [],
        notesToUpdate: [{ id: 'date-1', timeNote: '夕方から' }],
      });
    });

    it('時刻メモがクリアされた日付は null への更新対象になる', () => {
      // Arrange
      const existing = [
        { id: 'date-1', date: '2026-08-01', timeNote: '午後から' },
      ];
      const requested = [{ date: '2026-08-01', timeNote: null }];

      // Act
      const result = diffCandidateDates(existing, requested);

      // Assert
      expect(result).toEqual({
        datesToAdd: [],
        dateIdsToRemove: [],
        notesToUpdate: [{ id: 'date-1', timeNote: null }],
      });
    });

    it('timeNote 省略は null と同じ扱いにする（未指定でクリアされる）', () => {
      // Arrange
      const existing = [
        { id: 'date-1', date: '2026-08-01', timeNote: '午後から' },
      ];
      const requested = [{ date: '2026-08-01' }];

      // Act
      const result = diffCandidateDates(existing, requested);

      // Assert
      expect(result).toEqual({
        datesToAdd: [],
        dateIdsToRemove: [],
        notesToUpdate: [{ id: 'date-1', timeNote: null }],
      });
    });

    it('メモが同じ日付は更新対象に含めない（不要な UPDATE を出さない）', () => {
      // Arrange
      const existing = [
        { id: 'date-1', date: '2026-08-01', timeNote: '午後から' },
        { id: 'date-2', date: '2026-08-02', timeNote: null },
      ];
      const requested = [
        { date: '2026-08-01', timeNote: '午後から' },
        { date: '2026-08-02', timeNote: null },
      ];

      // Act
      const result = diffCandidateDates(existing, requested);

      // Assert
      expect(result.notesToUpdate).toEqual([]);
    });

    it('追加・削除・メモ更新が同時に起きても取り違えない', () => {
      // Arrange
      const existing = [
        { id: 'date-1', date: '2026-08-01', timeNote: null },
        { id: 'date-2', date: '2026-08-02', timeNote: '午後から' },
      ];
      const requested = [
        { date: '2026-08-02', timeNote: '夕方から' },
        { date: '2026-08-03', timeNote: '終日OK' },
      ];

      // Act
      const result = diffCandidateDates(existing, requested);

      // Assert
      expect(result).toEqual({
        datesToAdd: [{ date: '2026-08-03', timeNote: '終日OK' }],
        dateIdsToRemove: ['date-1'],
        notesToUpdate: [{ id: 'date-2', timeNote: '夕方から' }],
      });
    });
  });
});
