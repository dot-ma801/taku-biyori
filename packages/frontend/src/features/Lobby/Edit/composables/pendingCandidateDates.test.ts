import { describe, it, expect } from 'vitest';
import { DATE_NOTE_MAX_LENGTH } from '@taku-biyori/shared';
import {
  getDateNoteError,
  syncPendingDates,
  toCandidateDateInputs,
} from '@/features/Lobby/Edit/composables/pendingCandidateDates';

describe('syncPendingDates', () => {
  it('日付を追加するとひとことが空の行が増える', () => {
    // Arrange
    const current = [{ date: '2025-10-01', dateNote: '13:00〜' }];
    const selected = ['2025-10-01', '2025-10-02'];

    // Act
    const result = syncPendingDates(current, selected);

    // Assert
    expect(result).toEqual([
      { date: '2025-10-01', dateNote: '13:00〜' },
      { date: '2025-10-02', dateNote: '' },
    ]);
  });

  it('残る日付のひとことは保持される', () => {
    // Arrange
    const current = [
      { date: '2025-10-01', dateNote: '13:00〜' },
      { date: '2025-10-02', dateNote: '午後から' },
    ];
    const selected = ['2025-10-02'];

    // Act
    const result = syncPendingDates(current, selected);

    // Assert
    expect(result).toEqual([{ date: '2025-10-02', dateNote: '午後から' }]);
  });

  it('選択が空になれば空配列を返す', () => {
    // Arrange
    const current = [{ date: '2025-10-01', dateNote: '13:00〜' }];
    const selected: string[] = [];

    // Act
    const result = syncPendingDates(current, selected);

    // Assert
    expect(result).toEqual([]);
  });

  // 選んだ順ではなく日付順に並べる（表示・送信のどちらでも読み順が安定する）
  it('日付の昇順に並べ替える', () => {
    // Arrange
    const current: { date: string; dateNote: string }[] = [];
    const selected = ['2025-10-05', '2025-10-01', '2025-10-03'];

    // Act
    const result = syncPendingDates(current, selected);

    // Assert
    expect(result.map((entry) => entry.date)).toEqual([
      '2025-10-01',
      '2025-10-03',
      '2025-10-05',
    ]);
  });

  it('同じ日付が重複して選ばれても1件に丸める', () => {
    // Arrange
    const current: { date: string; dateNote: string }[] = [];
    const selected = ['2025-10-01', '2025-10-01'];

    // Act
    const result = syncPendingDates(current, selected);

    // Assert
    expect(result).toEqual([{ date: '2025-10-01', dateNote: '' }]);
  });

  it('一度外した日付を選び直すとひとことは空に戻る', () => {
    // Arrange
    const current = [{ date: '2025-10-01', dateNote: '13:00〜' }];

    // Act
    const removed = syncPendingDates(current, []);
    const readded = syncPendingDates(removed, ['2025-10-01']);

    // Assert
    expect(readded).toEqual([{ date: '2025-10-01', dateNote: '' }]);
  });
});

describe('getDateNoteError', () => {
  it('未入力はエラーにしない', () => {
    // Arrange
    const value = '';

    // Act
    const result = getDateNoteError(value);

    // Assert
    expect(result).toBeNull();
  });

  it('上限ちょうどはエラーにしない', () => {
    // Arrange
    const value = 'あ'.repeat(DATE_NOTE_MAX_LENGTH);

    // Act
    const result = getDateNoteError(value);

    // Assert
    expect(result).toBeNull();
  });

  it('上限を超えるとエラー文言を返す', () => {
    // Arrange
    const value = 'あ'.repeat(DATE_NOTE_MAX_LENGTH + 1);

    // Act
    const result = getDateNoteError(value);

    // Assert
    expect(result).toBe(
      `ひとことは${DATE_NOTE_MAX_LENGTH}文字以内で入力してください`,
    );
  });

  // 送信されるのは正規化後の値なので、末尾の空白だけで超過扱いにしない
  it('前後の空白を除けば収まる場合はエラーにしない', () => {
    // Arrange
    const value = `${'あ'.repeat(DATE_NOTE_MAX_LENGTH)}   `;

    // Act
    const result = getDateNoteError(value);

    // Assert
    expect(result).toBeNull();
  });
});

describe('toCandidateDateInputs', () => {
  it('ひとことを正規化して API の入力形式に変換する', () => {
    // Arrange
    const pending = [
      { date: '2025-10-01', dateNote: '  13:00〜17:00  ' },
      { date: '2025-10-02', dateNote: '   ' },
      { date: '2025-10-03', dateNote: '' },
    ];

    // Act
    const result = toCandidateDateInputs(pending);

    // Assert
    expect(result).toEqual([
      { date: '2025-10-01', dateNote: '13:00〜17:00' },
      { date: '2025-10-02', dateNote: null },
      { date: '2025-10-03', dateNote: null },
    ]);
  });
});
