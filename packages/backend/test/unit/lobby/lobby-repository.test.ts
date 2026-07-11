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

// select(...).from(...).where(...).limit(n) のチェーンをモックする
const makeSelectLimitDb = (rows: unknown[]) => {
  const chain = {
    from: vi.fn().mockReturnThis(),
    where: vi.fn().mockReturnThis(),
    limit: vi.fn().mockResolvedValue(rows),
  };
  const db = {
    select: vi.fn().mockReturnValue(chain),
  } as unknown as Database;
  return { db };
};

// select(...).from(...).leftJoin(...).where(...).orderBy(...) のチェーンをモックする
const makeSelectJoinOrderDb = (rows: unknown[]) => {
  const chain = {
    from: vi.fn().mockReturnThis(),
    leftJoin: vi.fn().mockReturnThis(),
    where: vi.fn().mockReturnThis(),
    orderBy: vi.fn().mockResolvedValue(rows),
  };
  const db = {
    select: vi.fn().mockReturnValue(chain),
  } as unknown as Database;
  return { db };
};

describe('findLobbyVisibility', () => {
  it('isPublished と hostUserId を返す', async () => {
    // Arrange
    const { db } = makeSelectLimitDb([
      { isPublished: true, hostUserId: 'user-1' },
    ]);
    const repo = createLobbyRepository(db);

    // Act
    const result = await repo.findLobbyVisibility(mockLobbyRow.id);

    // Assert
    expect(result).toEqual({ isPublished: true, hostUserId: 'user-1' });
  });

  it('行がなければ null を返す', async () => {
    // Arrange
    const { db } = makeSelectLimitDb([]);
    const repo = createLobbyRepository(db);

    // Act
    const result = await repo.findLobbyVisibility('nonexistent');

    // Assert
    expect(result).toBeNull();
  });
});

describe('findMembersByLobbyId', () => {
  it('LobbyMember の配列に変換して返す', async () => {
    // Arrange
    const { db } = makeSelectJoinOrderDb([
      {
        id: 'member-1',
        userId: 'user-1',
        userName: 'テストユーザー',
        guestName: null,
        createdAt: now,
      },
    ]);
    const repo = createLobbyRepository(db);

    // Act
    const result = await repo.findMembersByLobbyId(mockLobbyRow.id);

    // Assert
    expect(result).toEqual([
      {
        id: 'member-1',
        userId: 'user-1',
        userName: 'テストユーザー',
        guestName: null,
        joinedAt: now.toISOString(),
      },
    ]);
  });

  it('メンバーがいなければ空配列を返す', async () => {
    // Arrange
    const { db } = makeSelectJoinOrderDb([]);
    const repo = createLobbyRepository(db);

    // Act
    const result = await repo.findMembersByLobbyId(mockLobbyRow.id);

    // Assert
    expect(result).toEqual([]);
  });
});

describe('findMemberByUserId', () => {
  it('メンバーIDを返す', async () => {
    // Arrange
    const { db } = makeSelectLimitDb([{ id: 'member-1' }]);
    const repo = createLobbyRepository(db);

    // Act
    const result = await repo.findMemberByUserId(mockLobbyRow.id, 'user-1');

    // Assert
    expect(result).toBe('member-1');
  });

  it('参加していなければ null を返す', async () => {
    // Arrange
    const { db } = makeSelectLimitDb([]);
    const repo = createLobbyRepository(db);

    // Act
    const result = await repo.findMemberByUserId(mockLobbyRow.id, 'user-1');

    // Assert
    expect(result).toBeNull();
  });
});

describe('findMemberOwner', () => {
  it('lobbyId と userId を返す', async () => {
    // Arrange
    const { db } = makeSelectLimitDb([
      { lobbyId: mockLobbyRow.id, userId: 'user-2' },
    ]);
    const repo = createLobbyRepository(db);

    // Act
    const result = await repo.findMemberOwner('member-1');

    // Assert
    expect(result).toEqual({ lobbyId: mockLobbyRow.id, userId: 'user-2' });
  });

  it('存在しないメンバーIDは null を返す', async () => {
    // Arrange
    const { db } = makeSelectLimitDb([]);
    const repo = createLobbyRepository(db);

    // Act
    const result = await repo.findMemberOwner('nonexistent');

    // Assert
    expect(result).toBeNull();
  });
});

describe('findGuestLinkInfo', () => {
  it('hostUserId と token を返す', async () => {
    // Arrange
    const { db } = makeSelectLimitDb([
      { hostUserId: 'user-1', guestLinkToken: 'token-abc' },
    ]);
    const repo = createLobbyRepository(db);

    // Act
    const result = await repo.findGuestLinkInfo(mockLobbyRow.id);

    // Assert
    expect(result).toEqual({ hostUserId: 'user-1', token: 'token-abc' });
  });

  it('募集枠が存在しなければ null を返す', async () => {
    // Arrange
    const { db } = makeSelectLimitDb([]);
    const repo = createLobbyRepository(db);

    // Act
    const result = await repo.findGuestLinkInfo('nonexistent');

    // Assert
    expect(result).toBeNull();
  });
});

describe('findGuestLinkToken', () => {
  it('トークンを返す', async () => {
    // Arrange
    const { db } = makeSelectLimitDb([{ guestLinkToken: 'token-abc' }]);
    const repo = createLobbyRepository(db);

    // Act
    const result = await repo.findGuestLinkToken(mockLobbyRow.id);

    // Assert
    expect(result).toBe('token-abc');
  });

  it('募集枠が存在しなければ null を返す', async () => {
    // Arrange
    const { db } = makeSelectLimitDb([]);
    const repo = createLobbyRepository(db);

    // Act
    const result = await repo.findGuestLinkToken('nonexistent');

    // Assert
    expect(result).toBeNull();
  });
});

describe('addMember', () => {
  const makeInsertDb = (rows: unknown[], userRows: unknown[]) => {
    const insertChain = {
      values: vi.fn().mockReturnThis(),
      onConflictDoNothing: vi.fn().mockReturnThis(),
      returning: vi.fn().mockResolvedValue(rows),
    };
    const selectChain = {
      from: vi.fn().mockReturnThis(),
      where: vi.fn().mockReturnThis(),
      limit: vi.fn().mockResolvedValue(userRows),
    };
    const db = {
      insert: vi.fn().mockReturnValue(insertChain),
      select: vi.fn().mockReturnValue(selectChain),
    } as unknown as Database;
    return { db, insertChain };
  };

  it('LobbyMember を返す', async () => {
    // Arrange
    const { db } = makeInsertDb(
      [
        {
          id: 'member-1',
          userId: 'user-1',
          guestName: null,
          createdAt: now,
        },
      ],
      [{ name: 'テストユーザー' }],
    );
    const repo = createLobbyRepository(db);

    // Act
    const result = await repo.addMember(mockLobbyRow.id, 'user-1', {});

    // Assert
    expect(result).toEqual({
      id: 'member-1',
      userId: 'user-1',
      userName: 'テストユーザー',
      guestName: null,
      joinedAt: now.toISOString(),
    });
  });

  it('onConflictDoNothing で競合した場合は null を返す', async () => {
    // Arrange
    const { db } = makeInsertDb([], []);
    const repo = createLobbyRepository(db);

    // Act
    const result = await repo.addMember(mockLobbyRow.id, 'user-1', {});

    // Assert
    expect(result).toBeNull();
  });
});

describe('addGuestMember', () => {
  const makeInsertDb = (rows: unknown[]) => {
    const insertChain = {
      values: vi.fn().mockReturnThis(),
      returning: vi.fn().mockResolvedValue(rows),
    };
    const db = {
      insert: vi.fn().mockReturnValue(insertChain),
    } as unknown as Database;
    return { db, insertChain };
  };

  it('ゲストの LobbyMember を返す', async () => {
    // Arrange
    const { db } = makeInsertDb([
      { id: 'member-2', guestName: 'ゲスト太郎', createdAt: now },
    ]);
    const repo = createLobbyRepository(db);

    // Act
    const result = await repo.addGuestMember(mockLobbyRow.id, {
      guestName: 'ゲスト太郎',
    });

    // Assert
    expect(result).toEqual({
      id: 'member-2',
      userId: null,
      userName: null,
      guestName: 'ゲスト太郎',
      joinedAt: now.toISOString(),
    });
  });

  it('挿入に失敗したらエラーを投げる', async () => {
    // Arrange
    const { db } = makeInsertDb([]);
    const repo = createLobbyRepository(db);

    // Act & Assert
    await expect(
      repo.addGuestMember(mockLobbyRow.id, { guestName: 'ゲスト太郎' }),
    ).rejects.toThrow();
  });
});

describe('deleteMemberById', () => {
  it('delete().where() を呼び出す', async () => {
    // Arrange
    const deleteChain = { where: vi.fn().mockResolvedValue(undefined) };
    const db = {
      delete: vi.fn().mockReturnValue(deleteChain),
    } as unknown as Database;
    const repo = createLobbyRepository(db);

    // Act
    await repo.deleteMemberById('member-1');

    // Assert
    expect(db.delete).toHaveBeenCalledTimes(1);
    expect(deleteChain.where).toHaveBeenCalledTimes(1);
  });
});

// ----------------------------------------------------------------
// 日程調整（候補日・回答）

describe('findByLobbyId', () => {
  it('候補日ごとに回答をまとめた LobbyAvailabilityDate の配列を返す', async () => {
    // Arrange
    const { db } = makeSelectJoinOrderDb([
      {
        candidateId: 'date-1',
        date: '2025-09-01',
        answerId: 'answer-1',
        memberId: 'member-1',
        answer: 'ok',
        comment: null,
      },
      {
        candidateId: 'date-1',
        date: '2025-09-01',
        answerId: 'answer-2',
        memberId: 'member-2',
        answer: 'ng',
        comment: '用事があります',
      },
      {
        candidateId: 'date-2',
        date: '2025-09-08',
        answerId: null,
        memberId: null,
        answer: null,
        comment: null,
      },
    ]);
    const repo = createLobbyRepository(db);

    // Act
    const result = await repo.findByLobbyId(mockLobbyRow.id);

    // Assert
    expect(result).toEqual([
      {
        id: 'date-1',
        date: '2025-09-01',
        answers: [
          { id: 'answer-1', memberId: 'member-1', answer: 'ok', comment: null },
          {
            id: 'answer-2',
            memberId: 'member-2',
            answer: 'ng',
            comment: '用事があります',
          },
        ],
      },
      { id: 'date-2', date: '2025-09-08', answers: [] },
    ]);
  });

  it('候補日がなければ空配列を返す', async () => {
    // Arrange
    const { db } = makeSelectJoinOrderDb([]);
    const repo = createLobbyRepository(db);

    // Act
    const result = await repo.findByLobbyId(mockLobbyRow.id);

    // Assert
    expect(result).toEqual([]);
  });
});

describe('addDate', () => {
  const makeInsertReturningDb = (rows: unknown[]) => {
    const insertChain = {
      values: vi.fn().mockReturnThis(),
      returning: vi.fn().mockResolvedValue(rows),
    };
    const db = {
      insert: vi.fn().mockReturnValue(insertChain),
    } as unknown as Database;
    return { db, insertChain };
  };

  it('回答なしの LobbyAvailabilityDate を返す', async () => {
    // Arrange
    const { db } = makeInsertReturningDb([
      { id: 'date-1', date: '2025-09-01' },
    ]);
    const repo = createLobbyRepository(db);

    // Act
    const result = await repo.addDate(mockLobbyRow.id, '2025-09-01');

    // Assert
    expect(result).toEqual({ id: 'date-1', date: '2025-09-01', answers: [] });
  });

  it('挿入に失敗したらエラーを投げる', async () => {
    // Arrange
    const { db } = makeInsertReturningDb([]);
    const repo = createLobbyRepository(db);

    // Act & Assert
    await expect(repo.addDate(mockLobbyRow.id, '2025-09-01')).rejects.toThrow();
  });
});

describe('findCandidateOwner', () => {
  it('lobbyId と date を返す', async () => {
    // Arrange
    const { db } = makeSelectLimitDb([
      { lobbyId: mockLobbyRow.id, date: '2025-09-01' },
    ]);
    const repo = createLobbyRepository(db);

    // Act
    const result = await repo.findCandidateOwner('date-1');

    // Assert
    expect(result).toEqual({ lobbyId: mockLobbyRow.id, date: '2025-09-01' });
  });

  it('存在しない候補日IDは null を返す', async () => {
    // Arrange
    const { db } = makeSelectLimitDb([]);
    const repo = createLobbyRepository(db);

    // Act
    const result = await repo.findCandidateOwner('nonexistent');

    // Assert
    expect(result).toBeNull();
  });
});

describe('deleteDateById', () => {
  it('delete().where() を呼び出す', async () => {
    // Arrange
    const deleteChain = { where: vi.fn().mockResolvedValue(undefined) };
    const db = {
      delete: vi.fn().mockReturnValue(deleteChain),
    } as unknown as Database;
    const repo = createLobbyRepository(db);

    // Act
    await repo.deleteDateById('date-1');

    // Assert
    expect(db.delete).toHaveBeenCalledTimes(1);
    expect(deleteChain.where).toHaveBeenCalledTimes(1);
  });
});

describe('replaceAllDates', () => {
  // トランザクション内で delete().where() → insert().values().returning() の順に呼ばれることをモックする
  const makeReplaceTransactionDb = (insertedRows: unknown[]) => {
    const deleteChain = { where: vi.fn().mockResolvedValue(undefined) };
    const insertChain = {
      values: vi.fn().mockReturnThis(),
      returning: vi.fn().mockResolvedValue(insertedRows),
    };
    const tx = {
      delete: vi.fn().mockReturnValue(deleteChain),
      insert: vi.fn().mockReturnValue(insertChain),
    };
    const db = {
      transaction: vi
        .fn()
        .mockImplementation((fn: (tx: typeof tx) => unknown) => fn(tx)),
    } as unknown as Database;
    return { db, tx, deleteChain, insertChain };
  };

  it('全候補日を削除してから新しい候補日を挿入する', async () => {
    // Arrange
    const { db, tx } = makeReplaceTransactionDb([
      { id: 'date-1', date: '2025-10-01' },
      { id: 'date-2', date: '2025-10-02' },
    ]);
    const repo = createLobbyRepository(db);

    // Act
    const result = await repo.replaceAllDates(mockLobbyRow.id, [
      '2025-10-01',
      '2025-10-02',
    ]);

    // Assert
    expect(tx.delete).toHaveBeenCalledTimes(1);
    expect(tx.insert).toHaveBeenCalledTimes(1);
    expect(result).toEqual([
      { id: 'date-1', date: '2025-10-01', answers: [] },
      { id: 'date-2', date: '2025-10-02', answers: [] },
    ]);
  });

  it('dates が空配列なら insert を呼ばず空配列を返す', async () => {
    // Arrange
    const { db, tx } = makeReplaceTransactionDb([]);
    const repo = createLobbyRepository(db);

    // Act
    const result = await repo.replaceAllDates(mockLobbyRow.id, []);

    // Assert
    expect(tx.delete).toHaveBeenCalledTimes(1);
    expect(tx.insert).not.toHaveBeenCalled();
    expect(result).toEqual([]);
  });
});
