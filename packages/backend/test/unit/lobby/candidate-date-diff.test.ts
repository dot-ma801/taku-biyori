import { describe, expect, it } from 'vitest';
import { diffCandidateDates } from '@/lobby/domain/candidate-date-diff';

const EMPTY_DIFF = {
  datesToAdd: [],
  dateIdsToRemove: [],
  notesToUpdate: [],
};

describe('diffCandidateDates', () => {
  it('既存とリクエストが同じなら追加も削除もひとことの更新もない', () => {
    // Arrange
    const existing = [
      { id: 'date-1', date: '2026-08-01', dateNote: null },
      { id: 'date-2', date: '2026-08-02', dateNote: '午後から' },
    ];
    const requested = [
      { date: '2026-08-01', dateNote: null },
      { date: '2026-08-02', dateNote: '午後から' },
    ];

    // Act
    const result = diffCandidateDates(existing, requested);

    // Assert
    expect(result).toEqual(EMPTY_DIFF);
  });

  it('リクエストにだけある日付は追加対象になる', () => {
    // Arrange
    const existing = [{ id: 'date-1', date: '2026-08-01', dateNote: null }];
    const requested = [
      { date: '2026-08-01', dateNote: null },
      { date: '2026-08-02', dateNote: null },
      { date: '2026-08-03', dateNote: null },
    ];

    // Act
    const result = diffCandidateDates(existing, requested);

    // Assert
    expect(result).toEqual({
      datesToAdd: [
        { date: '2026-08-02', dateNote: null },
        { date: '2026-08-03', dateNote: null },
      ],
      dateIdsToRemove: [],
      notesToUpdate: [],
    });
  });

  it('追加する候補日はひとことも一緒に持つ', () => {
    // Arrange
    const existing: { id: string; date: string; dateNote: string | null }[] =
      [];
    const requested = [{ date: '2026-08-01', dateNote: '13:00〜17:00' }];

    // Act
    const result = diffCandidateDates(existing, requested);

    // Assert
    expect(result).toEqual({
      datesToAdd: [{ date: '2026-08-01', dateNote: '13:00〜17:00' }],
      dateIdsToRemove: [],
      notesToUpdate: [],
    });
  });

  it('既存にだけある日付はその ID が削除対象になる', () => {
    // Arrange
    const existing = [
      { id: 'date-1', date: '2026-08-01', dateNote: null },
      { id: 'date-2', date: '2026-08-02', dateNote: null },
      { id: 'date-3', date: '2026-08-03', dateNote: null },
    ];
    const requested = [{ date: '2026-08-02', dateNote: null }];

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
      { id: 'date-1', date: '2026-08-01', dateNote: null },
      { id: 'date-2', date: '2026-08-02', dateNote: null },
    ];
    const requested = [
      { date: '2026-08-02', dateNote: null },
      { date: '2026-08-05', dateNote: null },
    ];

    // Act
    const result = diffCandidateDates(existing, requested);

    // Assert
    expect(result).toEqual({
      datesToAdd: [{ date: '2026-08-05', dateNote: null }],
      dateIdsToRemove: ['date-1'],
      notesToUpdate: [],
    });
  });

  it('既存が空ならリクエスト全件が追加対象になる', () => {
    // Arrange
    const existing: { id: string; date: string; dateNote: string | null }[] =
      [];
    const requested = [{ date: '2026-08-01', dateNote: null }];

    // Act
    const result = diffCandidateDates(existing, requested);

    // Assert
    expect(result).toEqual({
      datesToAdd: [{ date: '2026-08-01', dateNote: null }],
      dateIdsToRemove: [],
      notesToUpdate: [],
    });
  });

  it('リクエストに重複した日付があっても追加対象は1件に丸める', () => {
    // Arrange
    const existing: { id: string; date: string; dateNote: string | null }[] =
      [];
    const requested = [
      { date: '2026-08-01', dateNote: '午前から' },
      { date: '2026-08-01', dateNote: '午後から' },
    ];

    // Act
    const result = diffCandidateDates(existing, requested);

    // Assert
    expect(result).toEqual({
      datesToAdd: [{ date: '2026-08-01', dateNote: '午前から' }],
      dateIdsToRemove: [],
      notesToUpdate: [],
    });
  });

  describe('ひとことの更新', () => {
    it('日付は残りひとことだけ変わった行は notesToUpdate に入る', () => {
      // Arrange
      const existing = [
        { id: 'date-1', date: '2026-08-01', dateNote: '午前から' },
      ];
      const requested = [{ date: '2026-08-01', dateNote: '午後から' }];

      // Act
      const result = diffCandidateDates(existing, requested);

      // Assert
      expect(result).toEqual({
        datesToAdd: [],
        dateIdsToRemove: [],
        notesToUpdate: [{ id: 'date-1', dateNote: '午後から' }],
      });
    });

    it('ひとことを未入力にすると null への更新になる', () => {
      // Arrange
      const existing = [
        { id: 'date-1', date: '2026-08-01', dateNote: '午前から' },
      ];
      const requested = [{ date: '2026-08-01', dateNote: null }];

      // Act
      const result = diffCandidateDates(existing, requested);

      // Assert
      expect(result).toEqual({
        datesToAdd: [],
        dateIdsToRemove: [],
        notesToUpdate: [{ id: 'date-1', dateNote: null }],
      });
    });

    it('未入力だった行にひとことを付けると更新対象になる', () => {
      // Arrange
      const existing = [{ id: 'date-1', date: '2026-08-01', dateNote: null }];
      const requested = [{ date: '2026-08-01', dateNote: '13:00〜' }];

      // Act
      const result = diffCandidateDates(existing, requested);

      // Assert
      expect(result).toEqual({
        datesToAdd: [],
        dateIdsToRemove: [],
        notesToUpdate: [{ id: 'date-1', dateNote: '13:00〜' }],
      });
    });

    it('削除される候補日のひとことは更新対象にしない', () => {
      // Arrange
      const existing = [
        { id: 'date-1', date: '2026-08-01', dateNote: '午前から' },
      ];
      const requested = [{ date: '2026-08-02', dateNote: '午後から' }];

      // Act
      const result = diffCandidateDates(existing, requested);

      // Assert
      expect(result).toEqual({
        datesToAdd: [{ date: '2026-08-02', dateNote: '午後から' }],
        dateIdsToRemove: ['date-1'],
        notesToUpdate: [],
      });
    });
  });
});
