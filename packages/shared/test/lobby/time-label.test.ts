import { describe, expect, it } from 'vitest';
import {
  TIME_LABEL_MAX_LENGTH,
  TimeLabelSchema,
  normalizeTimeLabel,
} from '@/lobby/time-label';

describe('normalizeTimeLabel', () => {
  it('前後の空白を落とした文字列を返す', () => {
    // Arrange
    const input = '  13:00〜17:00  ';

    // Act
    const result = normalizeTimeLabel(input);

    // Assert
    expect(result).toBe('13:00〜17:00');
  });

  it.each([
    ['空文字', ''],
    ['空白のみ', '　 \t '],
    ['null', null],
    ['undefined', undefined],
  ])('%s は null になる', (_label, input) => {
    // Act
    const result = normalizeTimeLabel(input);

    // Assert
    expect(result).toBeNull();
  });
});

describe('TimeLabelSchema', () => {
  it('上限ちょうどの文字数を受け付ける', () => {
    // Arrange
    const input = 'あ'.repeat(TIME_LABEL_MAX_LENGTH);

    // Act
    const result = TimeLabelSchema.safeParse(input);

    // Assert
    expect(result.success).toBe(true);
  });

  it('上限を超える文字数を拒否する', () => {
    // Arrange
    const input = 'あ'.repeat(TIME_LABEL_MAX_LENGTH + 1);

    // Act
    const result = TimeLabelSchema.safeParse(input);

    // Assert
    expect(result.success).toBe(false);
  });

  it('正規化すると上限に収まる文字列は受け付ける', () => {
    // Arrange
    const input = `${'あ'.repeat(TIME_LABEL_MAX_LENGTH)}    `;

    // Act
    const result = TimeLabelSchema.safeParse(input);

    // Assert
    expect(result.success).toBe(true);
  });

  it('parse 時に前後の空白を除去する', () => {
    // Arrange
    const input = '  午後  ';

    // Act
    const result = TimeLabelSchema.parse(input);

    // Assert
    expect(result).toBe('午後');
  });

  it('parse 時に空白のみを null に正規化する', () => {
    // Arrange
    const input = '   ';

    // Act
    const result = TimeLabelSchema.parse(input);

    // Assert
    expect(result).toBeNull();
  });
});
