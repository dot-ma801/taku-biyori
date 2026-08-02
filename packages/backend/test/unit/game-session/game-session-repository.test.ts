import { describe, expect, it, vi } from 'vitest';
import { PgDialect } from 'drizzle-orm/pg-core';
import type { SQL } from 'drizzle-orm';
import { createGameSessionRepository } from '@/game-session/infrastructure/game-session-repository';
import { createDatabase } from '@/system/infrastructure/database/client';
import type { Database } from '@/system/infrastructure/database/client';

const now = new Date('2025-01-01T00:00:00.000Z');

/** 卓作成の scheduledAt は必須（design-v1.1 §8）。過去日バリデーションを踏まない日付を使う */
const SCHEDULED_AT = '2999-12-31';

const mockSessionRow = {
  id: 'aaaaaaaa-0000-0000-0000-000000000001',
  hostUserId: 'user-1',
  title: 'テスト卓',
  scenarioName: null,
  description: null,
  maxPlayers: null,
  guestLinkToken: 'token-abc',
  isPublished: false,
  scheduledAt: '2025-05-30',
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

// select(...).from(...).leftJoin(...).where(...).groupBy() のチェーンをモックし、
// where に渡された条件式を SQL 文字列に変換して検証する。
const makeSelectDbCapturingWhere = (rows: unknown[]) => {
  let capturedWhere: SQL | undefined;
  const chain = {
    from: vi.fn().mockReturnThis(),
    leftJoin: vi.fn().mockReturnThis(),
    where: vi.fn().mockImplementation((condition: SQL) => {
      capturedWhere = condition;
      return chain;
    }),
    groupBy: vi.fn().mockResolvedValue(rows),
  };
  const db = {
    select: vi.fn().mockReturnValue(chain),
  } as unknown as Database;
  return {
    db,
    whereSql: () => {
      if (!capturedWhere) throw new Error('where が呼ばれていません');
      return new PgDialect().sqlToQuery(capturedWhere).sql;
    },
  };
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

// 公開卓ブランチ（他人の卓が一覧に混ざる経路）だけに終端状態の除外条件を付ける。
// 自分がホストの卓・自分が参加している卓は終端状態でも一覧に出す必要があるため、
// それらのブランチには条件を追加しない。
describe('findByUserId の公開卓ブランチ', () => {
  it('他人の完了済み公開卓を一覧に出さないため completed_at IS NULL を条件に含める', async () => {
    // Arrange
    const { db, whereSql } = makeSelectDbCapturingWhere([]);
    const repo = createGameSessionRepository(db);

    // Act
    await repo.findByUserId('user-1');

    // Assert
    expect(whereSql()).toContain('"completed_at" is null');
  });

  it('他人の中止済み公開卓を一覧に出さないため cancelled_at IS NULL を条件に含める', async () => {
    // Arrange
    const { db, whereSql } = makeSelectDbCapturingWhere([]);
    const repo = createGameSessionRepository(db);

    // Act
    await repo.findByUserId('user-1');

    // Assert
    expect(whereSql()).toContain('"cancelled_at" is null');
  });

  it('終端条件は is_published と AND で結合する（他人の実施前の公開卓は一覧に出る）', async () => {
    // Arrange
    const { db, whereSql } = makeSelectDbCapturingWhere([]);
    const repo = createGameSessionRepository(db);

    // Act
    await repo.findByUserId('user-1');

    // Assert
    const sql = whereSql();
    expect(sql).toMatch(
      /"is_published" = \$\d+ and "game_session"\."game_sessions"\."completed_at" is null and "game_session"\."game_sessions"\."cancelled_at" is null/,
    );
  });

  it('ホストの卓・参加中の卓のブランチには終端条件を付けない（自分の完了済み・中止済みの卓は一覧に出る）', async () => {
    // Arrange
    const { db, whereSql } = makeSelectDbCapturingWhere([]);
    const repo = createGameSessionRepository(db);

    // Act
    await repo.findByUserId('user-1');

    // Assert
    const sql = whereSql();
    // ホストブランチは host_user_id の比較のみ（終端条件が続かない）
    expect(sql).toMatch(
      /^\("game_session"\."game_sessions"\."host_user_id" = \$\d+ or exists/,
    );
    // 終端条件は公開卓ブランチの 2 つだけ（参加中ブランチにも付いていない）
    expect(sql.match(/is null/g)).toHaveLength(2);
  });

  it('自分がホストの完了済みの卓は一覧に含まれる', async () => {
    // Arrange
    const db = makeSelectDb([
      {
        ...mockSessionRow,
        hostUserId: 'user-1',
        isPublished: true,
        scheduledAt: SCHEDULED_AT,
        completedAt: now,
        memberCount: 1,
        userMemberId: 'member-uuid',
      },
    ]);
    const repo = createGameSessionRepository(db);

    // Act
    const result = await repo.findByUserId('user-1');

    // Assert
    expect(result).toHaveLength(1);
    expect(result[0]).toMatchObject({ status: 'completed', role: 'host' });
  });

  it('自分がホストの中止済みの卓は一覧に含まれる', async () => {
    // Arrange
    const db = makeSelectDb([
      {
        ...mockSessionRow,
        hostUserId: 'user-1',
        isPublished: true,
        scheduledAt: SCHEDULED_AT,
        cancelledAt: now,
        memberCount: 1,
        userMemberId: 'member-uuid',
      },
    ]);
    const repo = createGameSessionRepository(db);

    // Act
    const result = await repo.findByUserId('user-1');

    // Assert
    expect(result).toHaveLength(1);
    expect(result[0]).toMatchObject({ status: 'cancelled', role: 'host' });
  });

  it('自分が参加している完了済みの卓は一覧に含まれる', async () => {
    // Arrange
    const db = makeSelectDb([
      {
        ...mockSessionRow,
        hostUserId: 'other-user',
        isPublished: true,
        scheduledAt: SCHEDULED_AT,
        completedAt: now,
        memberCount: 2,
        userMemberId: 'member-uuid',
      },
    ]);
    const repo = createGameSessionRepository(db);

    // Act
    const result = await repo.findByUserId('user-1');

    // Assert
    expect(result).toHaveLength(1);
    expect(result[0]).toMatchObject({ status: 'completed', role: 'member' });
  });

  it('他人の実施前の公開卓は一覧に含まれる', async () => {
    // Arrange
    const db = makeSelectDb([
      {
        ...mockSessionRow,
        hostUserId: 'other-user',
        isPublished: true,
        scheduledAt: SCHEDULED_AT,
        memberCount: 1,
        userMemberId: null,
      },
    ]);
    const repo = createGameSessionRepository(db);

    // Act
    const result = await repo.findByUserId('user-1');

    // Assert
    expect(result).toHaveLength(1);
    expect(result[0]).toMatchObject({ status: 'confirmed', role: null });
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
      scheduledAt: SCHEDULED_AT,
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
      scheduledAt: SCHEDULED_AT,
      maxMembers: 5,
    });

    // Assert
    expect(result.maxMembers).toBe(5);
  });

  // scheduledAt は必須（`string`）なので、フォールバックせずそのまま INSERT する
  it('scheduledAt を values にそのまま渡す', async () => {
    // Arrange
    const { db, sessionInsert } = makeTransactionDb({
      ...mockSessionRow,
      scheduledAt: SCHEDULED_AT,
    });
    const repo = createGameSessionRepository(db);

    // Act
    await repo.createWithHost({
      hostUserId: 'user-1',
      title: 'テスト卓',
      guestLinkToken: 'token-abc',
      scheduledAt: SCHEDULED_AT,
    });

    // Assert
    expect(sessionInsert.values).toHaveBeenCalledWith(
      expect.objectContaining({ scheduledAt: SCHEDULED_AT }),
    );
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
      scheduledAt: SCHEDULED_AT,
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
      scheduledAt: SCHEDULED_AT,
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

  it('is_published が true の行だけを更新する（complete() と対称・draft 卓の中止を防ぐ）', async () => {
    // Arrange
    const cancelledAt = new Date('2025-06-01T00:00:00.000Z');
    const { db, whereSql } = makeUpdateDb([{ ...mockSessionRow, cancelledAt }]);
    const repo = createGameSessionRepository(db);

    // Act
    await repo.cancel(mockSessionRow.id, cancelledAt);

    // Assert
    const sql = whereSql();
    expect(sql).toContain('"is_published" = ');
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

// ----------------------------------------------------------------

// select(...).from(...).where(...).limit() のチェーンをモックする。
const makeLimitSelectDb = (rows: unknown[]) => {
  const chain = {
    from: vi.fn().mockReturnThis(),
    where: vi.fn().mockReturnThis(),
    limit: vi.fn().mockResolvedValue(rows),
  };
  return {
    select: vi.fn().mockReturnValue(chain),
  } as unknown as Database;
};

// 実際に Drizzle が組み立てる SQL を検証するための Database。
// insert 以降だけ本物のクエリビルダに通し、実行の直前で toSQL() を取り出して
// 接続せずに SQL 文字列を得る（URL はダミーで、postgres.js は実行時まで接続しない）。
const makeSqlCapturingUpsertDb = (rows: unknown[]) => {
  const real = createDatabase('postgres://dummy@127.0.0.1:1/dummy');
  let capturedSql = '';
  const db = {
    insert: (table: Parameters<Database['insert']>[0]) => ({
      values: (values: never) => ({
        onConflictDoUpdate: (config: never) => {
          const query = real
            .insert(table)
            .values(values)
            .onConflictDoUpdate(config);
          capturedSql = query.toSQL().sql;
          return { returning: () => Promise.resolve(rows) };
        },
      }),
    }),
  } as unknown as Database;
  return {
    db,
    sql: () => {
      if (!capturedSql) throw new Error('insert が呼ばれていません');
      return capturedSql;
    },
  };
};

// insert(...).values(...).onConflictDoUpdate(...).returning() のチェーンをモックする。
const makeUpsertDb = (rows: unknown[]) => {
  const onConflictDoUpdate = vi.fn().mockReturnValue({
    returning: vi.fn().mockResolvedValue(rows),
  });
  const values = vi.fn().mockReturnValue({ onConflictDoUpdate });
  const db = {
    insert: vi.fn().mockReturnValue({ values }),
  } as unknown as Database;
  return { db, values, onConflictDoUpdate };
};

const mockPlayMemoRow = {
  memberId: 'bbbbbbbb-0000-0000-0000-000000000001',
  body: 'メモ本文',
  sharedAt: null,
  updatedAt: now,
};

describe('findPlayMemoByMemberId', () => {
  it('DB の行を GameSessionPlayMemo に変換して返す', async () => {
    // Arrange
    const db = makeLimitSelectDb([mockPlayMemoRow]);
    const repo = createGameSessionRepository(db);

    // Act
    const result = await repo.findPlayMemoByMemberId(mockPlayMemoRow.memberId);

    // Assert
    expect(result).toEqual({
      memberId: mockPlayMemoRow.memberId,
      body: 'メモ本文',
      sharedAt: null,
      updatedAt: '2025-01-01T00:00:00.000Z',
    });
  });

  it('公開済みのメモは sharedAt を ISO 文字列で返す', async () => {
    // Arrange
    const sharedAt = new Date('2025-02-01T00:00:00.000Z');
    const db = makeLimitSelectDb([{ ...mockPlayMemoRow, sharedAt }]);
    const repo = createGameSessionRepository(db);

    // Act
    const result = await repo.findPlayMemoByMemberId(mockPlayMemoRow.memberId);

    // Assert
    expect(result?.sharedAt).toBe('2025-02-01T00:00:00.000Z');
  });

  it('行が無ければ null を返す', async () => {
    // Arrange
    const db = makeLimitSelectDb([]);
    const repo = createGameSessionRepository(db);

    // Act
    const result = await repo.findPlayMemoByMemberId(mockPlayMemoRow.memberId);

    // Assert
    expect(result).toBeNull();
  });
});

// ----------------------------------------------------------------

describe('upsertPlayMemo', () => {
  it('member_id の unique 制約を衝突キーに本文を更新する', async () => {
    // Arrange
    const { db, values, onConflictDoUpdate } = makeUpsertDb([mockPlayMemoRow]);
    const repo = createGameSessionRepository(db);

    // Act
    const result = await repo.upsertPlayMemo(
      mockPlayMemoRow.memberId,
      'メモ本文',
    );

    // Assert
    expect(values).toHaveBeenCalledWith({
      memberId: mockPlayMemoRow.memberId,
      body: 'メモ本文',
    });
    expect(onConflictDoUpdate).toHaveBeenCalledWith(
      expect.objectContaining({ set: { body: 'メモ本文' } }),
    );
    expect(result).toEqual({
      memberId: mockPlayMemoRow.memberId,
      body: 'メモ本文',
      sharedAt: null,
      updatedAt: '2025-01-01T00:00:00.000Z',
    });
  });

  // updated_at はスキーマの $onUpdate によって衝突更新の SET にも入る。
  // Drizzle が $onUpdate を onConflictDoUpdate へ適用しなくなると本文だけ新しく
  // updated_at が作成時刻のまま取り残されるため、生成 SQL で固定しておく。
  it('衝突更新で updated_at を更新し、shared_at は更新しない', async () => {
    // Arrange
    const { db, sql } = makeSqlCapturingUpsertDb([mockPlayMemoRow]);
    const repo = createGameSessionRepository(db);

    // Act
    await repo.upsertPlayMemo(mockPlayMemoRow.memberId, 'メモ本文');

    // Assert
    const updateClause = sql().split('do update set')[1]!;
    expect(updateClause).toContain('"body"');
    expect(updateClause).toContain('"updated_at"');
    expect(updateClause).not.toContain('"shared_at"');
  });

  // 本文の更新で公開状態を巻き戻さない（shared_at は set に含めない）
  it('shared_at を更新しない', async () => {
    // Arrange
    const sharedAt = new Date('2025-02-01T00:00:00.000Z');
    const { db, onConflictDoUpdate } = makeUpsertDb([
      { ...mockPlayMemoRow, sharedAt },
    ]);
    const repo = createGameSessionRepository(db);

    // Act
    const result = await repo.upsertPlayMemo(
      mockPlayMemoRow.memberId,
      'メモ本文',
    );

    // Assert
    expect(onConflictDoUpdate).toHaveBeenCalledWith(
      expect.objectContaining({
        set: expect.not.objectContaining({ sharedAt: expect.anything() }),
      }),
    );
    expect(result.sharedAt).toBe('2025-02-01T00:00:00.000Z');
  });
});

// ----------------------------------------------------------------

// update(...).set(...).where(...).returning() のチェーンをモックし、
// set に渡された値をキャプチャする。
const makeVisibilityUpdateDb = (rows: unknown[]) => {
  const chain = {
    set: vi.fn().mockReturnThis(),
    where: vi.fn().mockReturnThis(),
    returning: vi.fn().mockResolvedValue(rows),
  };
  const db = {
    update: vi.fn().mockReturnValue(chain),
  } as unknown as Database;
  return { db, set: chain.set };
};

describe('updatePlayMemoVisibility', () => {
  it('公開日時を設定して更新後のメモを返す', async () => {
    // Arrange
    const sharedAt = new Date('2025-02-01T00:00:00.000Z');
    const { db, set } = makeVisibilityUpdateDb([
      { ...mockPlayMemoRow, sharedAt },
    ]);
    const repo = createGameSessionRepository(db);

    // Act
    const result = await repo.updatePlayMemoVisibility(
      mockPlayMemoRow.memberId,
      sharedAt,
    );

    // Assert
    expect(set).toHaveBeenCalledWith({ sharedAt });
    expect(result).toEqual({
      memberId: mockPlayMemoRow.memberId,
      body: 'メモ本文',
      sharedAt: '2025-02-01T00:00:00.000Z',
      updatedAt: '2025-01-01T00:00:00.000Z',
    });
  });

  it('null を渡すと非公開に戻す', async () => {
    // Arrange
    const { db, set } = makeVisibilityUpdateDb([mockPlayMemoRow]);
    const repo = createGameSessionRepository(db);

    // Act
    const result = await repo.updatePlayMemoVisibility(
      mockPlayMemoRow.memberId,
      null,
    );

    // Assert
    expect(set).toHaveBeenCalledWith({ sharedAt: null });
    expect(result?.sharedAt).toBeNull();
  });

  // 公開切替で本文を書き換えない（本文は PUT .../play-memos/me の責務）
  it('本文を更新しない', async () => {
    // Arrange
    const { db, set } = makeVisibilityUpdateDb([mockPlayMemoRow]);
    const repo = createGameSessionRepository(db);

    // Act
    await repo.updatePlayMemoVisibility(mockPlayMemoRow.memberId, null);

    // Assert
    expect(set).toHaveBeenCalledWith(
      expect.not.objectContaining({ body: expect.anything() }),
    );
  });

  // メモ未作成のまま公開切替を呼ぶと更新対象が無い（ユースケース側で 404 になる）
  it('更新対象が無ければ null を返す', async () => {
    // Arrange
    const { db } = makeVisibilityUpdateDb([]);
    const repo = createGameSessionRepository(db);

    // Act
    const result = await repo.updatePlayMemoVisibility(
      mockPlayMemoRow.memberId,
      new Date(),
    );

    // Assert
    expect(result).toBeNull();
  });
});

// ----------------------------------------------------------------

// select(...).from(...).innerJoin(...).where(...).orderBy() のチェーンをモックし、
// where に渡された条件式を SQL 文字列に変換して検証する。
const makeInnerJoinSelectDb = (rows: unknown[]) => {
  let capturedWhere: SQL | undefined;
  const chain = {
    from: vi.fn().mockReturnThis(),
    innerJoin: vi.fn().mockReturnThis(),
    where: vi.fn().mockImplementation((condition: SQL) => {
      capturedWhere = condition;
      return chain;
    }),
    orderBy: vi.fn().mockResolvedValue(rows),
  };
  const db = {
    select: vi.fn().mockReturnValue(chain),
  } as unknown as Database;
  return {
    db,
    whereSql: () => {
      if (!capturedWhere) throw new Error('where が呼ばれていません');
      return new PgDialect().sqlToQuery(capturedWhere).sql;
    },
  };
};

describe('findSharedPlayMemos', () => {
  it('公開済みメモを SharedGameSessionPlayMemo に変換して返す', async () => {
    // Arrange
    const sharedAt = new Date('2025-02-01T00:00:00.000Z');
    const { db } = makeInnerJoinSelectDb([{ ...mockPlayMemoRow, sharedAt }]);
    const repo = createGameSessionRepository(db);

    // Act
    const result = await repo.findSharedPlayMemos(mockSessionRow.id);

    // Assert
    expect(result).toEqual([
      {
        memberId: mockPlayMemoRow.memberId,
        body: 'メモ本文',
        sharedAt: '2025-02-01T00:00:00.000Z',
        updatedAt: '2025-01-01T00:00:00.000Z',
      },
    ]);
  });

  // 非公開メモの漏洩を防ぐ要（shared_at is not null を DB 側で絞る）
  it('卓の絞り込みと shared_at の非 null を where に含める', async () => {
    // Arrange
    const { db, whereSql } = makeInnerJoinSelectDb([]);
    const repo = createGameSessionRepository(db);

    // Act
    await repo.findSharedPlayMemos(mockSessionRow.id);

    // Assert
    const sql = whereSql();
    expect(sql).toContain('"game_session_id"');
    expect(sql).toContain('"shared_at" is not null');
  });

  it('公開済みメモが無ければ空配列を返す', async () => {
    // Arrange
    const { db } = makeInnerJoinSelectDb([]);
    const repo = createGameSessionRepository(db);

    // Act
    const result = await repo.findSharedPlayMemos(mockSessionRow.id);

    // Assert
    expect(result).toEqual([]);
  });
});
