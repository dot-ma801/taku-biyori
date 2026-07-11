import { describe, expect, it, vi } from 'vitest';
import { PgDialect } from 'drizzle-orm/pg-core';
import type { SQL } from 'drizzle-orm';
import { createGameSessionRepository } from '@/game-session/infrastructure/game-session-repository';
import type { Database } from '@/system/infrastructure/database/client';

const now = new Date('2025-01-01T00:00:00.000Z');

const mockSessionRow = {
  id: 'aaaaaaaa-0000-0000-0000-000000000001',
  hostUserId: 'user-1',
  title: 'テスト卓',
  scenarioName: null,
  description: null,
  maxPlayers: null,
  guestLinkToken: 'token-abc',
  isPublished: false,
  openUntil: null,
  scheduledAt: null,
  completedAt: null,
  cancelledAt: null,
  lobbyId: null,
  createdAt: now,
  updatedAt: now,
};

const makeSelectDb = (rows: unknown[]) => {
  const chain = {
    from: vi.fn().mockReturnThis(),
    leftJoin: vi.fn().mockReturnThis(),
    where: vi.fn().mockReturnThis(),
    groupBy: vi.fn().mockResolvedValue(rows),
    orderBy: vi.fn().mockResolvedValue(rows),
  };
  return {
    select: vi.fn().mockReturnValue(chain),
  } as unknown as Database;
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

const makeTransactionDb = (sessionRow: unknown) => {
  const memberInsert = { values: vi.fn().mockResolvedValue([]) };
  const sessionInsert = {
    values: vi.fn().mockReturnValue({
      returning: vi.fn().mockResolvedValue([sessionRow]),
    }),
  };
  let callCount = 0;
  const txInsert = vi
    .fn()
    .mockImplementation(() =>
      callCount++ === 0 ? sessionInsert : memberInsert,
    );
  const tx = { insert: txInsert };
  return {
    db: {
      transaction: vi
        .fn()
        .mockImplementation((fn: (tx: typeof tx) => unknown) => fn(tx)),
    } as unknown as Database,
    txInsert,
    memberInsert,
    sessionInsert,
  };
};

// ----------------------------------------------------------------

describe('findByUserId', () => {
  it('DB の行を GameSessionListItem に変換して返す', async () => {
    // Arrange
    const db = makeSelectDb([
      { ...mockSessionRow, memberCount: 1, userMemberId: null },
    ]);
    const repo = createGameSessionRepository(db);

    // Act
    const result = await repo.findByUserId('user-1');

    // Assert
    expect(result).toHaveLength(1);
    expect(result[0]).toMatchObject({
      id: mockSessionRow.id,
      title: 'テスト卓',
      status: 'draft',
      isPublished: false,
      memberCount: 1,
      createdAt: '2025-01-01T00:00:00.000Z',
      updatedAt: '2025-01-01T00:00:00.000Z',
      role: 'host',
    });
  });

  it('hostUserId が一致しない行は role: member になる', async () => {
    // Arrange
    const db = makeSelectDb([
      {
        ...mockSessionRow,
        hostUserId: 'other-user',
        memberCount: 2,
        userMemberId: 'member-uuid',
      },
    ]);
    const repo = createGameSessionRepository(db);

    // Act
    const result = await repo.findByUserId('user-1');

    // Assert
    expect(result[0]).toMatchObject({ role: 'member' });
  });

  it('userMemberId が null の行は role: null になる', async () => {
    // Arrange
    const db = makeSelectDb([
      {
        ...mockSessionRow,
        hostUserId: 'other-user',
        memberCount: 1,
        userMemberId: null,
      },
    ]);
    const repo = createGameSessionRepository(db);

    // Act
    const result = await repo.findByUserId('user-1');

    // Assert
    expect(result[0]).toMatchObject({ role: null });
  });

  it('memberCount が文字列で返ってきても number に変換する', async () => {
    // Arrange
    const db = makeSelectDb([
      { ...mockSessionRow, memberCount: '3', userMemberId: null },
    ]);
    const repo = createGameSessionRepository(db);

    // Act
    const result = await repo.findByUserId('user-1');

    // Assert
    expect(typeof result[0]?.memberCount).toBe('number');
    expect(result[0]?.memberCount).toBe(3);
  });

  it('maxPlayers が maxMembers にマッピングされる', async () => {
    // Arrange
    const db = makeSelectDb([
      { ...mockSessionRow, maxPlayers: 6, memberCount: 2, userMemberId: null },
    ]);
    const repo = createGameSessionRepository(db);

    // Act
    const result = await repo.findByUserId('user-1');

    // Assert
    expect(result[0]?.maxMembers).toBe(6);
  });

  it('maxPlayers が null のとき maxMembers は null になる', async () => {
    // Arrange
    const db = makeSelectDb([
      {
        ...mockSessionRow,
        maxPlayers: null,
        memberCount: 1,
        userMemberId: null,
      },
    ]);
    const repo = createGameSessionRepository(db);

    // Act
    const result = await repo.findByUserId('user-1');

    // Assert
    expect(result[0]?.maxMembers).toBeNull();
  });

  it('行が空なら空配列を返す', async () => {
    // Arrange
    const db = makeSelectDb([]);
    const repo = createGameSessionRepository(db);

    // Act
    const result = await repo.findByUserId('user-1');

    // Assert
    expect(result).toEqual([]);
  });
});

// ----------------------------------------------------------------

describe('createWithHost', () => {
  it('DB の行を GameSession に変換して返す', async () => {
    // Arrange
    const { db } = makeTransactionDb(mockSessionRow);
    const repo = createGameSessionRepository(db);

    // Act
    const result = await repo.createWithHost({
      hostUserId: 'user-1',
      title: 'テスト卓',
      guestLinkToken: 'token-abc',
    });

    // Assert
    expect(result).toMatchObject({
      id: mockSessionRow.id,
      title: 'テスト卓',
      status: 'draft',
      isPublished: false,
      createdBy: 'user-1',
      maxMembers: null,
      createdAt: '2025-01-01T00:00:00.000Z',
      updatedAt: '2025-01-01T00:00:00.000Z',
    });
  });

  it('maxPlayers が maxMembers にマッピングされる', async () => {
    // Arrange
    const { db } = makeTransactionDb({ ...mockSessionRow, maxPlayers: 5 });
    const repo = createGameSessionRepository(db);

    // Act
    const result = await repo.createWithHost({
      hostUserId: 'user-1',
      title: 'テスト卓',
      guestLinkToken: 'token-abc',
      maxMembers: 5,
    });

    // Assert
    expect(result.maxMembers).toBe(5);
  });

  it('ホストを game_session_members に追加する', async () => {
    // Arrange
    const { db, txInsert, memberInsert } = makeTransactionDb(mockSessionRow);
    const repo = createGameSessionRepository(db);

    // Act
    await repo.createWithHost({
      hostUserId: 'user-1',
      title: 'テスト卓',
      guestLinkToken: 'token-abc',
    });

    // Assert
    expect(txInsert).toHaveBeenCalledTimes(2);
    expect(memberInsert.values).toHaveBeenCalledWith(
      expect.objectContaining({
        gameSessionId: mockSessionRow.id,
        userId: 'user-1',
      }),
    );
  });

  it('トランザクション内で処理される', async () => {
    // Arrange
    const { db } = makeTransactionDb(mockSessionRow);
    const transactionSpy = db.transaction as ReturnType<typeof vi.fn>;
    const repo = createGameSessionRepository(db);

    // Act
    await repo.createWithHost({
      hostUserId: 'user-1',
      title: 'テスト卓',
      guestLinkToken: 'token-abc',
    });

    // Assert
    expect(transactionSpy).toHaveBeenCalledTimes(1);
  });
});

// ----------------------------------------------------------------

describe('cancel', () => {
  it('cancelled_at が NULL の行だけを更新する（二重中止の排他）', async () => {
    // Arrange
    const cancelledAt = new Date('2025-06-01T00:00:00.000Z');
    const { db, whereSql } = makeUpdateDb([{ ...mockSessionRow, cancelledAt }]);
    const repo = createGameSessionRepository(db);

    // Act
    await repo.cancel(mockSessionRow.id, cancelledAt);

    // Assert
    const sql = whereSql();
    expect(sql).toContain('"cancelled_at" is null');
  });

  it('completed_at が NULL の行だけを更新する（完了との並行実行の排他）', async () => {
    // Arrange
    const cancelledAt = new Date('2025-06-01T00:00:00.000Z');
    const { db, whereSql } = makeUpdateDb([{ ...mockSessionRow, cancelledAt }]);
    const repo = createGameSessionRepository(db);

    // Act
    await repo.cancel(mockSessionRow.id, cancelledAt);

    // Assert
    const sql = whereSql();
    expect(sql).toContain('"completed_at" is null');
  });

  it('更新行が 0 件なら null を返す', async () => {
    // Arrange
    const { db } = makeUpdateDb([]);
    const repo = createGameSessionRepository(db);

    // Act
    const result = await repo.cancel(
      mockSessionRow.id,
      new Date('2025-06-01T00:00:00.000Z'),
    );

    // Assert
    expect(result).toBeNull();
  });

  it('既に completedAt が設定されている（完了と競合した）場合は null を返す', async () => {
    // Arrange
    // WHERE 句に completed_at IS NULL が含まれるため、
    // 完了済みの行は更新対象にならず 0 件（= null）が返る想定
    const { db } = makeUpdateDb([]);
    const repo = createGameSessionRepository(db);

    // Act
    const result = await repo.cancel(
      mockSessionRow.id,
      new Date('2025-06-01T00:00:00.000Z'),
    );

    // Assert
    expect(result).toBeNull();
  });

  it('更新に成功したら cancelled ステータスの GameSession を返す', async () => {
    // Arrange
    const cancelledAt = new Date('2025-06-01T00:00:00.000Z');
    const { db } = makeUpdateDb([
      {
        ...mockSessionRow,
        isPublished: true,
        scheduledAt: '2025-05-01',
        cancelledAt,
      },
    ]);
    const repo = createGameSessionRepository(db);

    // Act
    const result = await repo.cancel(mockSessionRow.id, cancelledAt);

    // Assert
    expect(result).toMatchObject({
      id: mockSessionRow.id,
      status: 'cancelled',
      cancelledAt: cancelledAt.toISOString(),
    });
  });
});

// ----------------------------------------------------------------

describe('complete', () => {
  it('completed_at が NULL の行だけを更新する（二重完了の排他）', async () => {
    // Arrange
    const completedAt = new Date('2025-06-01T00:00:00.000Z');
    const { db, whereSql } = makeUpdateDb([{ ...mockSessionRow, completedAt }]);
    const repo = createGameSessionRepository(db);

    // Act
    await repo.complete(mockSessionRow.id, completedAt);

    // Assert
    const sql = whereSql();
    expect(sql).toContain('"completed_at" is null');
  });

  it('cancelled_at が NULL の行だけを更新する（中止との並行実行の排他）', async () => {
    // Arrange
    const completedAt = new Date('2025-06-01T00:00:00.000Z');
    const { db, whereSql } = makeUpdateDb([{ ...mockSessionRow, completedAt }]);
    const repo = createGameSessionRepository(db);

    // Act
    await repo.complete(mockSessionRow.id, completedAt);

    // Assert
    const sql = whereSql();
    expect(sql).toContain('"cancelled_at" is null');
  });

  it('更新行が 0 件なら null を返す', async () => {
    // Arrange
    const { db } = makeUpdateDb([]);
    const repo = createGameSessionRepository(db);

    // Act
    const result = await repo.complete(
      mockSessionRow.id,
      new Date('2025-06-01T00:00:00.000Z'),
    );

    // Assert
    expect(result).toBeNull();
  });

  it('既に cancelledAt が設定されている（中止と競合した）場合は null を返す', async () => {
    // Arrange
    // WHERE 句に cancelled_at IS NULL が含まれるため、
    // 中止済みの行は更新対象にならず 0 件（= null）が返る想定
    const { db } = makeUpdateDb([]);
    const repo = createGameSessionRepository(db);

    // Act
    const result = await repo.complete(
      mockSessionRow.id,
      new Date('2025-06-01T00:00:00.000Z'),
    );

    // Assert
    expect(result).toBeNull();
  });

  it('更新に成功したら completed ステータスの GameSession を返す', async () => {
    // Arrange
    const completedAt = new Date('2025-06-01T00:00:00.000Z');
    const { db } = makeUpdateDb([
      {
        ...mockSessionRow,
        isPublished: true,
        openUntil: '2025-04-01',
        scheduledAt: '2025-05-01',
        completedAt,
      },
    ]);
    const repo = createGameSessionRepository(db);

    // Act
    const result = await repo.complete(mockSessionRow.id, completedAt);

    // Assert
    expect(result).toMatchObject({
      id: mockSessionRow.id,
      status: 'completed',
      completedAt: completedAt.toISOString(),
    });
  });
});

// ----------------------------------------------------------------

describe('findDetailById', () => {
  const makeDetailSelectDb = (rows: unknown[]) => {
    const chain = {
      from: vi.fn().mockReturnThis(),
      leftJoin: vi.fn().mockReturnThis(),
      where: vi.fn().mockResolvedValue(rows),
    };
    return { select: vi.fn().mockReturnValue(chain) } as unknown as Database;
  };

  it('lobbyId を GameSession に含める', async () => {
    // Arrange
    const db = makeDetailSelectDb([
      {
        ...mockSessionRow,
        lobbyId: 'lobby-1',
        memberId: null,
        memberUserId: null,
        memberUserName: null,
        memberGuestName: null,
        memberCharacterName: null,
        memberLobbyMemberId: null,
        memberCreatedAt: null,
      },
    ]);
    const repo = createGameSessionRepository(db);

    // Act
    const result = await repo.findDetailById(mockSessionRow.id);

    // Assert
    expect(result).toMatchObject({ lobbyId: 'lobby-1' });
  });

  it('メンバーの lobbyMemberId を含める', async () => {
    // Arrange
    const db = makeDetailSelectDb([
      {
        ...mockSessionRow,
        memberId: 'member-1',
        memberUserId: 'user-2',
        memberUserName: 'テストユーザー',
        memberGuestName: null,
        memberCharacterName: null,
        memberLobbyMemberId: 'lobby-member-1',
        memberCreatedAt: now,
      },
    ]);
    const repo = createGameSessionRepository(db);

    // Act
    const result = await repo.findDetailById(mockSessionRow.id);

    // Assert
    expect(result?.members[0]).toMatchObject({
      id: 'member-1',
      lobbyMemberId: 'lobby-member-1',
    });
  });

  it('lobby 経由でないメンバーの lobbyMemberId は null になる', async () => {
    // Arrange
    const db = makeDetailSelectDb([
      {
        ...mockSessionRow,
        memberId: 'member-1',
        memberUserId: 'user-2',
        memberUserName: 'テストユーザー',
        memberGuestName: null,
        memberCharacterName: null,
        memberLobbyMemberId: null,
        memberCreatedAt: now,
      },
    ]);
    const repo = createGameSessionRepository(db);

    // Act
    const result = await repo.findDetailById(mockSessionRow.id);

    // Assert
    expect(result?.members[0]).toMatchObject({
      id: 'member-1',
      lobbyMemberId: null,
    });
  });
});
