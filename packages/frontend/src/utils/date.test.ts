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
});
