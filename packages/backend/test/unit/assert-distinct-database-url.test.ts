import { describe, expect, it } from 'vitest';
import { assertDistinctFromDatabaseUrl } from '@/system/infrastructure/database/assert-distinct-database-url';

describe('assertDistinctFromDatabaseUrl', () => {
  it('DATABASE_URL が未設定なら何もしない', () => {
    // Arrange
    const testDatabaseUrl = 'postgresql://usr:pw@localhost:5432/taku_biyori';

    // Act & Assert
    expect(() =>
      assertDistinctFromDatabaseUrl(testDatabaseUrl, undefined),
    ).not.toThrow();
  });

  it('データベース名が異なれば何もしない', () => {
    // Arrange
    const testDatabaseUrl =
      'postgresql://usr:pw@localhost:5432/taku_biyori_test';
    const databaseUrl = 'postgresql://usr:pw@localhost:5432/taku_biyori';

    // Act & Assert
    expect(() =>
      assertDistinctFromDatabaseUrl(testDatabaseUrl, databaseUrl),
    ).not.toThrow();
  });

  it('host・port・データベース名が完全に一致すると throw する', () => {
    // Arrange
    const url = 'postgresql://usr:pw@localhost:5432/taku_biyori';

    // Act & Assert
    expect(() => assertDistinctFromDatabaseUrl(url, url)).toThrow(
      'TEST_DATABASE_URL が DATABASE_URL と同じ接続先を指しています',
    );
  });

  it('資格情報やクエリパラメータが違っても host・port・DB名が同じなら throw する', () => {
    // Arrange
    const testDatabaseUrl =
      'postgresql://other-user:other-pw@localhost:5432/taku_biyori?sslmode=disable';
    const databaseUrl = 'postgresql://usr:pw@localhost:5432/taku_biyori';

    // Act & Assert
    expect(() =>
      assertDistinctFromDatabaseUrl(testDatabaseUrl, databaseUrl),
    ).toThrow();
  });

  it('host の大文字小文字が違っても同じ接続先とみなして throw する', () => {
    // Arrange
    const testDatabaseUrl = 'postgresql://usr:pw@LOCALHOST:5432/taku_biyori';
    const databaseUrl = 'postgresql://usr:pw@localhost:5432/taku_biyori';

    // Act & Assert
    expect(() =>
      assertDistinctFromDatabaseUrl(testDatabaseUrl, databaseUrl),
    ).toThrow();
  });

  it('ポート省略時は既定値 5432 とみなして比較する', () => {
    // Arrange
    const testDatabaseUrl = 'postgresql://usr:pw@localhost/taku_biyori';
    const databaseUrl = 'postgresql://usr:pw@localhost:5432/taku_biyori';

    // Act & Assert
    expect(() =>
      assertDistinctFromDatabaseUrl(testDatabaseUrl, databaseUrl),
    ).toThrow();
  });

  it('ポートが異なれば別の接続先とみなす', () => {
    // Arrange
    const testDatabaseUrl = 'postgresql://usr:pw@localhost:5433/taku_biyori';
    const databaseUrl = 'postgresql://usr:pw@localhost:5432/taku_biyori';

    // Act & Assert
    expect(() =>
      assertDistinctFromDatabaseUrl(testDatabaseUrl, databaseUrl),
    ).not.toThrow();
  });
});
