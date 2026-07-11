import { describe, expect, it, vi } from 'vitest';
import { PgDialect } from 'drizzle-orm/pg-core';
import type { SQL } from 'drizzle-orm';
import { createLobbyRepository } from '@/lobby/infrastructure/lobby-repository';
import type { Database } from '@/system/infrastructure/database/client';

const now = new Date('2025-01-01T00:00:00.000Z');

const mockLobbyRow = {
  id: 'aaaaaaaa-0000-0000-0000-000000000001',
  hostUserId: 'user-1',
  title: 'テスト募集',
  scenarioName: null,
  description: null,
  location: null,
  maxPlayers: null,
  guestLinkToken: 'token-abc',
  isPublished: true,
  openUntil: null,
  closedAt: null,
  cancelledAt: null,
  createdAt: now,
  updatedAt: now,
};

// update(...).set(...).where(...).returning() のチェーンをモックし、
// where に渡された条件式をキャプチャして SQL 文字列に変換して検証する。
const makeUpdateDb = (rows: unknown[]) => {
  let capturedWhere: SQL | undefined;
  const chain = {
    set: vi.fn().mockReturnThis(),
    where: vi.fn().mockImplementation((condition: SQL) => {
      capturedWhere = condition;
      return chain;
    }),
    returning: vi.fn().mockResolvedValue(rows),
  };
  const db = {
    update: vi.fn().mockReturnValue(chain),
  } as unknown as Database;
  return {
    db,
    whereSql: () => {
      if (!capturedWhere) throw new Error('where が呼ばれていません');
      return new PgDialect().sqlToQuery(capturedWhere).sql;
    },
  };
};

describe('cancel', () => {
  it('cancelled_at と closed_at の両方が NULL の行だけを更新する（確定との排他）', async () => {
    // Arrange
    const { db, whereSql } = makeUpdateDb([
      { ...mockLobbyRow, cancelledAt: now },
    ]);
    const repo = createLobbyRepository(db);

    // Act
    await repo.cancel(mockLobbyRow.id);

    // Assert
    const sql = whereSql();
    expect(sql).toContain('"cancelled_at" is null');
    expect(sql).toContain('"closed_at" is null');
  });

  it('更新行が 0 件なら null を返す', async () => {
    // Arrange
    const { db } = makeUpdateDb([]);
    const repo = createLobbyRepository(db);

    // Act
    const result = await repo.cancel(mockLobbyRow.id);

    // Assert
    expect(result).toBeNull();
  });

  it('更新に成功したら Lobby を返す', async () => {
    // Arrange
    const { db } = makeUpdateDb([{ ...mockLobbyRow, cancelledAt: now }]);
    const repo = createLobbyRepository(db);

    // Act
    const result = await repo.cancel(mockLobbyRow.id);

    // Assert
    expect(result).toMatchObject({
      id: mockLobbyRow.id,
      status: 'cancelled',
      cancelledAt: now.toISOString(),
    });
  });
});

describe('publish', () => {
  it('is_published = false の行だけを更新する', async () => {
    // Arrange
    const { db, whereSql } = makeUpdateDb([
      { ...mockLobbyRow, isPublished: true },
    ]);
    const repo = createLobbyRepository(db);

    // Act
    await repo.publish(mockLobbyRow.id);

    // Assert
    expect(whereSql()).toContain('"is_published" = ');
  });

  it('更新行が 0 件なら null を返す', async () => {
    // Arrange
    const { db } = makeUpdateDb([]);
    const repo = createLobbyRepository(db);

    // Act
    const result = await repo.publish(mockLobbyRow.id);

    // Assert
    expect(result).toBeNull();
  });
});
