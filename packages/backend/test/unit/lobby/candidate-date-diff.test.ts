import { describe, expect, it } from 'vitest';
import { diffCandidateDates } from '@/lobby/domain/candidate-date-diff';

describe('diffCandidateDates', () => {
  it('既存とリクエストが同じなら追加も削除もない', () => {
    // Arrange
    const existing = [
      { id: 'date-1', date: '2026-08-01' },
      { id: 'date-2', date: '2026-08-02' },
    ];
    const requested = ['2026-08-01', '2026-08-02'];

    // Act
    const result = diffCandidateDates(existing, requested);

    // Assert
    expect(result).toEqual({ datesToAdd: [], dateIdsToRemove: [] });
  });

  it('リクエストにだけある日付は追加対象になる', () => {
    // Arrange
    const existing = [{ id: 'date-1', date: '2026-08-01' }];
    const requested = ['2026-08-01', '2026-08-02', '2026-08-03'];

    // Act
    const result = diffCandidateDates(existing, requested);

    // Assert
    expect(result).toEqual({
      datesToAdd: ['2026-08-02', '2026-08-03'],
      dateIdsToRemove: [],
    });
  });

  it('既存にだけある日付はその ID が削除対象になる', () => {
    // Arrange
    const existing = [
      { id: 'date-1', date: '2026-08-01' },
      { id: 'date-2', date: '2026-08-02' },
      { id: 'date-3', date: '2026-08-03' },
    ];
    const requested = ['2026-08-02'];

    // Act
    const result = diffCandidateDates(existing, requested);

    // Assert
    expect(result).toEqual({
      datesToAdd: [],
      dateIdsToRemove: ['date-1', 'date-3'],
    });
  });

  it('追加と削除が混在してもそれぞれ正しく判定する（残る日付は触らない）', () => {
    // Arrange
    const existing = [
      { id: 'date-1', date: '2026-08-01' },
      { id: 'date-2', date: '2026-08-02' },
    ];
    const requested = ['2026-08-02', '2026-08-05'];

    // Act
    const result = diffCandidateDates(existing, requested);

    // Assert
    expect(result).toEqual({
      datesToAdd: ['2026-08-05'],
      dateIdsToRemove: ['date-1'],
    });
  });

  it('既存が空ならリクエスト全件が追加対象になる', () => {
    // Arrange
    const existing: { id: string; date: string }[] = [];
    const requested = ['2026-08-01'];

    // Act
    const result = diffCandidateDates(existing, requested);

    // Assert
    expect(result).toEqual({
      datesToAdd: ['2026-08-01'],
      dateIdsToRemove: [],
    });
  });

  it('リクエストに重複した日付があっても追加対象は1件に丸める', () => {
    // Arrange
    const existing: { id: string; date: string }[] = [];
    const requested = ['2026-08-01', '2026-08-01'];

    // Act
    const result = diffCandidateDates(existing, requested);

    // Assert
    expect(result).toEqual({
      datesToAdd: ['2026-08-01'],
      dateIdsToRemove: [],
    });
  });
});
