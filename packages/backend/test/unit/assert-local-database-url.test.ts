import { describe, expect, it } from 'vitest';
import { assertLocalDatabaseUrl } from '@/system/infrastructure/database/assert-local-database-url';

describe('assertLocalDatabaseUrl', () => {
  it('localhost なら何もしない', () => {
    // Arrange
    const url = 'postgresql://usr:pw@localhost:5432/taku_biyori';

    // Act & Assert
    expect(() => assertLocalDatabaseUrl(url, false)).not.toThrow();
  });

  it('127.0.0.1 なら何もしない', () => {
    // Arrange
    const url = 'postgresql://usr:pw@127.0.0.1:5432/taku_biyori';

    // Act & Assert
    expect(() => assertLocalDatabaseUrl(url, false)).not.toThrow();
  });

  it('::1 なら何もしない', () => {
    // Arrange
    const url = 'postgresql://usr:pw@[::1]:5432/taku_biyori';

    // Act & Assert
    expect(() => assertLocalDatabaseUrl(url, false)).not.toThrow();
  });

  it('リモートホストなら throw する', () => {
    // Arrange
    const url = 'postgresql://usr:pw@db.example.com:5432/taku_biyori';

    // Act & Assert
    expect(() => assertLocalDatabaseUrl(url, false)).toThrow(
      'db:seed の接続先',
    );
  });

  it('リモートホストでも allowRemote が true なら通す', () => {
    // Arrange
    const url = 'postgresql://usr:pw@db.example.com:5432/taku_biyori';

    // Act & Assert
    expect(() => assertLocalDatabaseUrl(url, true)).not.toThrow();
  });
});
