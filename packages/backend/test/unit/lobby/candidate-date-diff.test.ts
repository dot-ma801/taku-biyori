import { describe, expect, it } from 'vitest';
import { diffCandidateDates } from '@/lobby/domain/candidate-date-diff';

const EMPTY_DIFF = {
  datesToAdd: [],
  dateIdsToRemove: [],
  timeLabelsToUpdate: [],
};

describe('diffCandidateDates', () => {
  it('既存とリクエストが同じなら追加も削除も時間帯の更新もない', () => {
    // Arrange
    const existing = [
      { id: 'date-1', date: '2026-08-01', timeLabel: null },
      { id: 'date-2', date: '2026-08-02', timeLabel: '午後から' },
    ];
    const requested = [
      { date: '2026-08-01', timeLabel: null },
      { date: '2026-08-02', timeLabel: '午後から' },
    ];

    // Act
    const result = diffCandidateDates(existing, requested);

    // Assert
    expect(result).toEqual(EMPTY_DIFF);
  });

  it('リクエストにだけある日付は追加対象になる', () => {
    // Arrange
    const existing = [{ id: 'date-1', date: '2026-08-01', timeLabel: null }];
    const requested = [
      { date: '2026-08-01', timeLabel: null },
      { date: '2026-08-02', timeLabel: null },
      { date: '2026-08-03', timeLabel: null },
    ];

    // Act
    const result = diffCandidateDates(existing, requested);

    // Assert
    expect(result).toEqual({
      datesToAdd: [
        { date: '2026-08-02', timeLabel: null },
        { date: '2026-08-03', timeLabel: null },
      ],
      dateIdsToRemove: [],
      timeLabelsToUpdate: [],
    });
  });

  it('追加する候補日は時間帯も一緒に持つ', () => {
    // Arrange
    const existing: { id: string; date: string; timeLabel: string | null }[] =
      [];
    const requested = [{ date: '2026-08-01', timeLabel: '13:00〜17:00' }];

    // Act
    const result = diffCandidateDates(existing, requested);

    // Assert
    expect(result).toEqual({
      datesToAdd: [{ date: '2026-08-01', timeLabel: '13:00〜17:00' }],
      dateIdsToRemove: [],
      timeLabelsToUpdate: [],
    });
  });

  it('既存にだけある日付はその ID が削除対象になる', () => {
    // Arrange
    const existing = [
      { id: 'date-1', date: '2026-08-01', timeLabel: null },
      { id: 'date-2', date: '2026-08-02', timeLabel: null },
      { id: 'date-3', date: '2026-08-03', timeLabel: null },
    ];
    const requested = [{ date: '2026-08-02', timeLabel: null }];

    // Act
    const result = diffCandidateDates(existing, requested);

    // Assert
    expect(result).toEqual({
      datesToAdd: [],
      dateIdsToRemove: ['date-1', 'date-3'],
      timeLabelsToUpdate: [],
    });
  });

  it('追加と削除が混在してもそれぞれ正しく判定する（残る日付は触らない）', () => {
    // Arrange
    const existing = [
      { id: 'date-1', date: '2026-08-01', timeLabel: null },
      { id: 'date-2', date: '2026-08-02', timeLabel: null },
    ];
    const requested = [
      { date: '2026-08-02', timeLabel: null },
      { date: '2026-08-05', timeLabel: null },
    ];

    // Act
    const result = diffCandidateDates(existing, requested);

    // Assert
    expect(result).toEqual({
      datesToAdd: [{ date: '2026-08-05', timeLabel: null }],
      dateIdsToRemove: ['date-1'],
      timeLabelsToUpdate: [],
    });
  });

  it('既存が空ならリクエスト全件が追加対象になる', () => {
    // Arrange
    const existing: { id: string; date: string; timeLabel: string | null }[] =
      [];
    const requested = [{ date: '2026-08-01', timeLabel: null }];

    // Act
    const result = diffCandidateDates(existing, requested);

    // Assert
    expect(result).toEqual({
      datesToAdd: [{ date: '2026-08-01', timeLabel: null }],
      dateIdsToRemove: [],
      timeLabelsToUpdate: [],
    });
  });

  it('リクエストに重複した日付があっても追加対象は1件に丸める', () => {
    // Arrange
    const existing: { id: string; date: string; timeLabel: string | null }[] =
      [];
    const requested = [
      { date: '2026-08-01', timeLabel: '午前から' },
      { date: '2026-08-01', timeLabel: '午後から' },
    ];

    // Act
    const result = diffCandidateDates(existing, requested);

    // Assert
    expect(result).toEqual({
      datesToAdd: [{ date: '2026-08-01', timeLabel: '午前から' }],
      dateIdsToRemove: [],
      timeLabelsToUpdate: [],
    });
  });

  describe('時間帯の更新', () => {
    it('日付は残り時間帯だけ変わった行は timeLabelsToUpdate に入る', () => {
      // Arrange
      const existing = [
        { id: 'date-1', date: '2026-08-01', timeLabel: '午前から' },
      ];
      const requested = [{ date: '2026-08-01', timeLabel: '午後から' }];

      // Act
      const result = diffCandidateDates(existing, requested);

      // Assert
      expect(result).toEqual({
        datesToAdd: [],
        dateIdsToRemove: [],
        timeLabelsToUpdate: [{ id: 'date-1', timeLabel: '午後から' }],
      });
    });

    it('時間帯を未入力にすると null への更新になる', () => {
      // Arrange
      const existing = [
        { id: 'date-1', date: '2026-08-01', timeLabel: '午前から' },
      ];
      const requested = [{ date: '2026-08-01', timeLabel: null }];

      // Act
      const result = diffCandidateDates(existing, requested);

      // Assert
      expect(result).toEqual({
        datesToAdd: [],
        dateIdsToRemove: [],
        timeLabelsToUpdate: [{ id: 'date-1', timeLabel: null }],
      });
    });

    it('未入力だった行に時間帯を付けると更新対象になる', () => {
      // Arrange
      const existing = [{ id: 'date-1', date: '2026-08-01', timeLabel: null }];
      const requested = [{ date: '2026-08-01', timeLabel: '13:00〜' }];

      // Act
      const result = diffCandidateDates(existing, requested);

      // Assert
      expect(result).toEqual({
        datesToAdd: [],
        dateIdsToRemove: [],
        timeLabelsToUpdate: [{ id: 'date-1', timeLabel: '13:00〜' }],
      });
    });

    it('削除される候補日の時間帯は更新対象にしない', () => {
      // Arrange
      const existing = [
        { id: 'date-1', date: '2026-08-01', timeLabel: '午前から' },
      ];
      const requested = [{ date: '2026-08-02', timeLabel: '午後から' }];

      // Act
      const result = diffCandidateDates(existing, requested);

      // Assert
      expect(result).toEqual({
        datesToAdd: [{ date: '2026-08-02', timeLabel: '午後から' }],
        dateIdsToRemove: ['date-1'],
        timeLabelsToUpdate: [],
      });
    });
  });
});
