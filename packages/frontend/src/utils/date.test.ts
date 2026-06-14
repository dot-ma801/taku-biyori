import { describe, it, expect } from 'vitest';
import { formatDateShort, formatDateWithWeekday } from '@/utils/date';

describe('formatDateShort', () => {
  it('月と日を "M/D" 形式で返す', () => {
    // Arrange & Act & Assert
    expect(formatDateShort('2026-06-10')).toBe('6/10');
  });

  it('月が1桁の場合はゼロ埋めしない', () => {
    // Arrange & Act & Assert
    expect(formatDateShort('2026-01-01')).toBe('1/1');
  });

  it('月が2桁の場合も正しくフォーマットする', () => {
    // Arrange & Act & Assert
    expect(formatDateShort('2026-12-31')).toBe('12/31');
  });

  it('日付でない文字列の場合は "0/0" を返す', () => {
    // parseDateParts が month=0, day=0 を返すため
    expect(formatDateShort('invalid')).toBe('0/0');
    expect(formatDateShort('')).toBe('0/0');
  });

  it('範囲外の月はそのまま返す', () => {
    // バリデーションは呼び出し元（zod）が担うため、ここでは素通し
    expect(formatDateShort('2026-13-01')).toBe('13/1');
  });
});

describe('formatDateWithWeekday', () => {
  it('日曜日（日）を正しく返す', () => {
    // Arrange & Act & Assert
    expect(formatDateWithWeekday('2026-06-07')).toBe('6/7（日）');
  });

  it('月曜日（月）を正しく返す', () => {
    // Arrange & Act & Assert
    expect(formatDateWithWeekday('2026-06-08')).toBe('6/8（月）');
  });

  it('火曜日（火）を正しく返す', () => {
    // Arrange & Act & Assert
    expect(formatDateWithWeekday('2026-06-09')).toBe('6/9（火）');
  });

  it('水曜日（水）を正しく返す', () => {
    // Arrange & Act & Assert
    expect(formatDateWithWeekday('2026-06-10')).toBe('6/10（水）');
  });

  it('木曜日（木）を正しく返す', () => {
    // Arrange & Act & Assert
    expect(formatDateWithWeekday('2026-06-11')).toBe('6/11（木）');
  });

  it('金曜日（金）を正しく返す', () => {
    // Arrange & Act & Assert
    expect(formatDateWithWeekday('2026-06-12')).toBe('6/12（金）');
  });

  it('土曜日（土）を正しく返す', () => {
    // Arrange & Act & Assert
    expect(formatDateWithWeekday('2026-06-13')).toBe('6/13（土）');
  });

  it('月が1桁の場合もゼロ埋めしない', () => {
    // Arrange & Act & Assert
    expect(formatDateWithWeekday('2026-01-01')).toBe('1/1（木）');
  });

  it('日付でない文字列の場合は曜日が空文字になる', () => {
    // Invalid Date の getDay() が NaN になるため WEEKDAYS[NaN] は undefined → ''
    expect(formatDateWithWeekday('invalid')).toBe('0/0（）');
    expect(formatDateWithWeekday('')).toBe('0/0（）');
  });

  it('存在しない日付（うるう年でない 2/29）は JS Date がオーバーフローして 3/1 の曜日になる', () => {
    // new Date(2026, 1, 29) → 2026-03-01（日曜）
    expect(formatDateWithWeekday('2026-02-29')).toBe('2/29（日）');
  });
});
