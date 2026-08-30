import { describe, it, expect } from 'vitest';
import { TIME_LABEL_MAX_LENGTH } from '@taku-biyori/shared';
import {
  getTimeLabelCounter,
  getTimeLabelError,
  getPendingTimeLabelErrors,
  syncPendingDates,
  toCandidateDateInputs,
} from '@/utils/pendingCandidateDates';

describe('syncPendingDates', () => {
  it('日付を追加するとひとことが空の行が増える', () => {
    // Arrange
    const current = [{ date: '2025-10-01', timeLabel: '13:00〜' }];
    const selected = ['2025-10-01', '2025-10-02'];

    // Act
    const result = syncPendingDates(current, selected);

    // Assert
    expect(result).toEqual([
      { date: '2025-10-01', timeLabel: '13:00〜' },
      { date: '2025-10-02', timeLabel: '' },
    ]);
  });

  it('残る日付のひとことは保持される', () => {
    // Arrange
    const current = [
      { date: '2025-10-01', timeLabel: '13:00〜' },
      { date: '2025-10-02', timeLabel: '午後から' },
    ];
    const selected = ['2025-10-02'];

    // Act
    const result = syncPendingDates(current, selected);

    // Assert
    expect(result).toEqual([{ date: '2025-10-02', timeLabel: '午後から' }]);
  });

  it('選択が空になれば空配列を返す', () => {
    // Arrange
    const current = [{ date: '2025-10-01', timeLabel: '13:00〜' }];
    const selected: string[] = [];

    // Act
    const result = syncPendingDates(current, selected);

    // Assert
    expect(result).toEqual([]);
  });

  // 選んだ順ではなく日付順に並べる（表示・送信のどちらでも読み順が安定する）
  it('日付の昇順に並べ替える', () => {
    // Arrange
    const current: { date: string; timeLabel: string }[] = [];
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
    const current: { date: string; timeLabel: string }[] = [];
    const selected = ['2025-10-01', '2025-10-01'];

    // Act
    const result = syncPendingDates(current, selected);

    // Assert
    expect(result).toEqual([{ date: '2025-10-01', timeLabel: '' }]);
  });

  it('一度外した日付を選び直すとひとことは空に戻る', () => {
    // Arrange
    const current = [{ date: '2025-10-01', timeLabel: '13:00〜' }];

    // Act
    const removed = syncPendingDates(current, []);
    const readded = syncPendingDates(removed, ['2025-10-01']);

    // Assert
    expect(readded).toEqual([{ date: '2025-10-01', timeLabel: '' }]);
  });
});

describe('getTimeLabelError', () => {
  it('未入力はエラーにしない', () => {
    // Arrange
    const value = '';

    // Act
    const result = getTimeLabelError(value);

    // Assert
    expect(result).toBeNull();
  });

  it('上限ちょうどはエラーにしない', () => {
    // Arrange
    const value = 'あ'.repeat(TIME_LABEL_MAX_LENGTH);

    // Act
    const result = getTimeLabelError(value);

    // Assert
    expect(result).toBeNull();
  });

  it('上限を超えるとエラー文言を返す', () => {
    // Arrange
    const value = 'あ'.repeat(TIME_LABEL_MAX_LENGTH + 1);

    // Act
    const result = getTimeLabelError(value);

    // Assert
    expect(result).toBe(
      `ひとことは${TIME_LABEL_MAX_LENGTH}文字以内で入力してください`,
    );
  });

  // 送信されるのは正規化後の値なので、末尾の空白だけで超過扱いにしない
  it('前後の空白を除けば収まる場合はエラーにしない', () => {
    // Arrange
    const value = `${'あ'.repeat(TIME_LABEL_MAX_LENGTH)}   `;

    // Act
    const result = getTimeLabelError(value);

    // Assert
    expect(result).toBeNull();
  });
});

describe('toCandidateDateInputs', () => {
  it('ひとことを正規化して API の入力形式に変換する', () => {
    // Arrange
    const pending = [
      { date: '2025-10-01', timeLabel: '  13:00〜17:00  ' },
      { date: '2025-10-02', timeLabel: '   ' },
      { date: '2025-10-03', timeLabel: '' },
    ];

    // Act
    const result = toCandidateDateInputs(pending);

    // Assert
    expect(result).toEqual([
      { date: '2025-10-01', timeLabel: '13:00〜17:00' },
      { date: '2025-10-02', timeLabel: null },
      { date: '2025-10-03', timeLabel: null },
    ]);
  });
});

describe('getPendingTimeLabelErrors', () => {
  it('すべて上限内なら空配列を返す', () => {
    // Arrange
    const pending = [
      { date: '2025-05-01', timeLabel: '13:00〜17:00' },
      { date: '2025-05-02', timeLabel: '' },
    ];

    // Act
    const result = getPendingTimeLabelErrors(pending);

    // Assert
    expect(result).toEqual([]);
  });

  // 送信時のアラートは複数まとめて出るので、どの候補日のことか分かる文言にする
  it('超過した候補日は日付付きのエラー文言を返す', () => {
    // Arrange
    const pending = [
      {
        date: '2025-05-01',
        timeLabel: 'あ'.repeat(TIME_LABEL_MAX_LENGTH + 1),
      },
    ];

    // Act
    const result = getPendingTimeLabelErrors(pending);

    // Assert
    expect(result).toEqual([
      `5/1（木）のひとことは${TIME_LABEL_MAX_LENGTH}文字以内で入力してください`,
    ]);
  });

  it('超過した候補日が複数あればすべて返す', () => {
    // Arrange
    const pending = [
      {
        date: '2025-05-01',
        timeLabel: 'あ'.repeat(TIME_LABEL_MAX_LENGTH + 1),
      },
      { date: '2025-05-02', timeLabel: '午後から' },
      {
        date: '2025-05-03',
        timeLabel: 'い'.repeat(TIME_LABEL_MAX_LENGTH + 5),
      },
    ];

    // Act
    const result = getPendingTimeLabelErrors(pending);

    // Assert
    expect(result).toHaveLength(2);
    expect(result[0]).toContain('5/1（木）');
    expect(result[1]).toContain('5/3（土）');
  });
});

describe('getTimeLabelCounter', () => {
  it('未入力は 0 から数える', () => {
    // Arrange
    const value = '';

    // Act
    const result = getTimeLabelCounter(value);

    // Assert
    expect(result).toEqual({
      label: `0 / ${TIME_LABEL_MAX_LENGTH}`,
      isOver: false,
    });
  });

  it('入力済みの文字数を数える', () => {
    // Arrange
    const value = '13:00〜17:00';

    // Act
    const result = getTimeLabelCounter(value);

    // Assert
    expect(result).toEqual({
      label: `11 / ${TIME_LABEL_MAX_LENGTH}`,
      isOver: false,
    });
  });

  it('上限ちょうどは超過扱いにしない', () => {
    // Arrange
    const value = 'あ'.repeat(TIME_LABEL_MAX_LENGTH);

    // Act
    const result = getTimeLabelCounter(value);

    // Assert
    expect(result.isOver).toBe(false);
  });

  it('上限を超えると isOver が true になる', () => {
    // Arrange
    const value = 'あ'.repeat(TIME_LABEL_MAX_LENGTH + 1);

    // Act
    const result = getTimeLabelCounter(value);

    // Assert
    expect(result).toEqual({
      label: `${TIME_LABEL_MAX_LENGTH + 1} / ${TIME_LABEL_MAX_LENGTH}`,
      isOver: true,
    });
  });

  // 保存されるのは正規化後の値なので、カウンターも同じ基準で数える
  // （そうしないと「21/20 なのにエラーが出ない」がありうる）
  it('前後の空白は数えない', () => {
    // Arrange
    const value = '  午後から  ';

    // Act
    const result = getTimeLabelCounter(value);

    // Assert
    expect(result.label).toBe(`4 / ${TIME_LABEL_MAX_LENGTH}`);
  });
});
