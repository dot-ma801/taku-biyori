import { describe, expect, it } from 'vitest';
import { HealthResponseSchema } from '@taku-biyori/shared';
import { getHealth } from '@/health/application/get-health';

describe('getHealth', () => {
  it('共有スキーマに合う疎通確認レスポンスを返す', () => {
    // Arrange
    const expected = {
      status: 'ok',
      message: 'Backend is running',
    };

    // Act
    const health = getHealth();

    // Assert
    expect(health).toEqual(expected);
    expect(HealthResponseSchema.parse(health)).toEqual(expected);
  });
});
