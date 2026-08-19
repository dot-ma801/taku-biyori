import { describe, expect, it } from 'vitest';
import { isUniqueViolation } from '@/system/infrastructure/database/errors';

describe('isUniqueViolation', () => {
  it('SQLSTATE 23505 のエラーを一意制約違反と判定する', () => {
    // Arrange
    const error = Object.assign(new Error('duplicate key'), { code: '23505' });

    // Act
    const result = isUniqueViolation(error);

    // Assert
    expect(result).toBe(true);
  });

  it('cause に包まれた 23505 も判定する（Drizzle は元のエラーを包んで投げる）', () => {
    // Arrange
    const cause = Object.assign(new Error('duplicate key'), { code: '23505' });
    const error = new Error('Failed query', { cause });

    // Act
    const result = isUniqueViolation(error);

    // Assert
    expect(result).toBe(true);
  });

  it('別の SQLSTATE は一意制約違反と判定しない', () => {
    // Arrange
    const cause = Object.assign(new Error('not null violation'), {
      code: '23502',
    });
    const error = new Error('Failed query', { cause });

    // Act
    const result = isUniqueViolation(error);

    // Assert
    expect(result).toBe(false);
  });

  it('cause が循環していても停止する', () => {
    // Arrange
    const error: { cause?: unknown } = {};
    error.cause = error;

    // Act
    const result = isUniqueViolation(error);

    // Assert
    expect(result).toBe(false);
  });

  it('エラーでない値は false を返す', () => {
    // Arrange / Act / Assert
    expect(isUniqueViolation(null)).toBe(false);
    expect(isUniqueViolation('23505')).toBe(false);
  });
});
