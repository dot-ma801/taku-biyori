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

describe('applyDateChanges', () => {
  // トランザクション内で delete().where() と insert().values() が呼ばれることをモックする。
  // delete の where に渡された条件式をキャプチャして SQL 文字列で検証する。
  const makeApplyTransactionDb = () => {
    let capturedWhere: SQL | undefined;
    const deleteChain = {
      where: vi.fn().mockImplementation((condition: SQL) => {
        capturedWhere = condition;
        return Promise.resolve(undefined);
      }),
    };
    const insertChain = {
      values: vi.fn().mockResolvedValue(undefined),
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
    return {
      db,
      tx,
      insertChain,
      whereSql: () => {
        if (!capturedWhere) throw new Error('where が呼ばれていません');
        return new PgDialect().sqlToQuery(capturedWhere).sql;
      },
    };
  };

  it('削除対象の候補日だけを削除し、追加対象の候補日だけを挿入する', async () => {
    // Arrange
    const { db, tx, insertChain, whereSql } = makeApplyTransactionDb();
    const repo = createLobbyRepository(db);

    // Act
    await repo.applyDateChanges(mockLobbyRow.id, {
      datesToAdd: ['2025-10-05'],
      dateIdsToRemove: ['date-2'],
    });

    // Assert
    expect(tx.delete).toHaveBeenCalledTimes(1);
    expect(tx.insert).toHaveBeenCalledTimes(1);
    expect(insertChain.values).toHaveBeenCalledWith([
      { lobbyId: mockLobbyRow.id, date: '2025-10-05' },
    ]);
    // 削除は対象募集枠の行に限定される（他の募集枠の候補日を誤って消さない）
    const sql = whereSql();
    expect(sql).toContain('"lobby_id" = ');
    expect(sql).toContain('"id" in ');
  });

  it('追加対象が無ければ insert を呼ばない', async () => {
    // Arrange
    const { db, tx } = makeApplyTransactionDb();
    const repo = createLobbyRepository(db);

    // Act
    await repo.applyDateChanges(mockLobbyRow.id, {
      datesToAdd: [],
      dateIdsToRemove: ['date-1'],
    });

    // Assert
    expect(tx.delete).toHaveBeenCalledTimes(1);
    expect(tx.insert).not.toHaveBeenCalled();
  });

  it('削除対象が無ければ delete を呼ばない', async () => {
    // Arrange
    const { db, tx } = makeApplyTransactionDb();
    const repo = createLobbyRepository(db);

    // Act
    await repo.applyDateChanges(mockLobbyRow.id, {
      datesToAdd: ['2025-10-05'],
      dateIdsToRemove: [],
    });

    // Assert
    expect(tx.delete).not.toHaveBeenCalled();
    expect(tx.insert).toHaveBeenCalledTimes(1);
  });
});

describe('isGuestMember', () => {
  it('user_id が null のメンバーなら true を返す', async () => {
    // Arrange
    const { db } = makeSelectLimitDb([{ userId: null }]);
    const repo = createLobbyRepository(db);

    // Act
    const result = await repo.isGuestMember(mockLobbyRow.id, 'member-2');

    // Assert
    expect(result).toBe(true);
  });

  it('該当行がなければ false を返す（ログインメンバー・存在しないメンバーを含む）', async () => {
    // Arrange
    const { db } = makeSelectLimitDb([]);
    const repo = createLobbyRepository(db);

    // Act
    const result = await repo.isGuestMember(mockLobbyRow.id, 'member-1');

    // Assert
    expect(result).toBe(false);
  });
});

describe('upsertAnswer', () => {
  const makeUpsertDb = (rows: unknown[]) => {
    const insertChain = {
      values: vi.fn().mockReturnThis(),
      onConflictDoUpdate: vi.fn().mockReturnThis(),
      returning: vi.fn().mockResolvedValue(rows),
    };
    const db = {
      insert: vi.fn().mockReturnValue(insertChain),
    } as unknown as Database;
    return { db, insertChain };
  };

  it('回答を登録して LobbyAvailabilityDateAnswer を返す', async () => {
    // Arrange
    const { db } = makeUpsertDb([
      {
        id: 'answer-1',
        memberId: 'member-1',
        answer: 'ok',
        comment: null,
      },
    ]);
    const repo = createLobbyRepository(db);

    // Act
    const result = await repo.upsertAnswer('date-1', 'member-1', {
      answer: 'ok',
    });

    // Assert
    expect(result).toEqual({
      id: 'answer-1',
      memberId: 'member-1',
      answer: 'ok',
      comment: null,
    });
  });

  it('candidateId・memberId の組で競合したら更新する', async () => {
    // Arrange
    const { db, insertChain } = makeUpsertDb([
      {
        id: 'answer-1',
        memberId: 'member-1',
        answer: 'maybe',
        comment: 'たぶん行ける',
      },
    ]);
    const repo = createLobbyRepository(db);

    // Act
    await repo.upsertAnswer('date-1', 'member-1', {
      answer: 'maybe',
      comment: 'たぶん行ける',
    });

    // Assert
    expect(insertChain.onConflictDoUpdate).toHaveBeenCalledWith(
      expect.objectContaining({
        set: expect.objectContaining({
          answer: 'maybe',
          comment: 'たぶん行ける',
        }),
      }),
    );
  });

  it('挿入に失敗したらエラーを投げる', async () => {
    // Arrange
    const { db } = makeUpsertDb([]);
    const repo = createLobbyRepository(db);

    // Act & Assert
    await expect(
      repo.upsertAnswer('date-1', 'member-1', { answer: 'ok' }),
    ).rejects.toThrow();
  });
});

// ----------------------------------------------------------------
// 卓確定（POST /api/lobbies/:id/confirm）関連
// ----------------------------------------------------------------

describe('findLobbyCore', () => {
  it('卓生成に必要なフィールドを返す', async () => {
    // Arrange
    const { db } = makeSelectLimitDb([
      {
        hostUserId: 'user-1',
        title: 'テスト募集',
        scenarioName: 'シナリオA',
        description: '説明',
        location: '会場',
        maxPlayers: 4,
      },
    ]);
    const repo = createLobbyRepository(db);

    // Act
    const result = await repo.findLobbyCore(mockLobbyRow.id);

    // Assert
    expect(result).toEqual({
      hostUserId: 'user-1',
      title: 'テスト募集',
      scenarioName: 'シナリオA',
      description: '説明',
      location: '会場',
      maxPlayers: 4,
    });
  });

  it('募集枠が存在しなければ null を返す', async () => {
    // Arrange
    const { db } = makeSelectLimitDb([]);
    const repo = createLobbyRepository(db);

    // Act
    const result = await repo.findLobbyCore('nonexistent');

    // Assert
    expect(result).toBeNull();
  });
});

describe('findMemberCoresByIds', () => {
  const makeSelectWhereDb = (rows: unknown[]) => {
    const chain = {
      from: vi.fn().mockReturnThis(),
      where: vi.fn().mockReturnThis(),
      for: vi.fn().mockResolvedValue(rows),
    };
    const db = {
      select: vi.fn().mockReturnValue(chain),
    } as unknown as Database;
    return { db, chain };
  };

  it('この募集枠に属する指定 ID のメンバーのみ返す', async () => {
    // Arrange
    const { db } = makeSelectWhereDb([
      { id: 'member-1', userId: 'user-2', guestName: null },
    ]);
    const repo = createLobbyRepository(db);

    // Act
    const result = await repo.findMemberCoresByIds(mockLobbyRow.id, [
      'member-1',
    ]);

    // Assert
    expect(result).toEqual([
      { id: 'member-1', userId: 'user-2', guestName: null },
    ]);
  });

  it('FOR KEY SHARE でメンバー行をロックする（並行退出との競合防止）', async () => {
    // Arrange
    const { db, chain } = makeSelectWhereDb([
      { id: 'member-1', userId: 'user-2', guestName: null },
    ]);
    const repo = createLobbyRepository(db);

    // Act
    await repo.findMemberCoresByIds(mockLobbyRow.id, ['member-1']);

    // Assert
    expect(chain.for).toHaveBeenCalledWith('key share');
  });

  it('memberIds が空配列ならクエリを発行せず空配列を返す', async () => {
    // Arrange
    const { db } = makeSelectWhereDb([]);
    const repo = createLobbyRepository(db);

    // Act
    const result = await repo.findMemberCoresByIds(mockLobbyRow.id, []);

    // Assert
    expect(result).toEqual([]);
    expect(db.select).not.toHaveBeenCalled();
  });
});

describe('closeLobby', () => {
  it('closed_at・cancelled_at の両方が NULL の行だけを更新する（二重確定の排他）', async () => {
    // Arrange
    const closedAt = new Date('2026-07-11T10:00:00.000Z');
    const { db, whereSql } = makeUpdateDb([{ ...mockLobbyRow, closedAt }]);
    const repo = createLobbyRepository(db);

    // Act
    await repo.closeLobby(mockLobbyRow.id, closedAt);

    // Assert
    const sql = whereSql();
    expect(sql).toContain('"closed_at" is null');
    expect(sql).toContain('"cancelled_at" is null');
  });

  it('更新行が 0 件なら false を返す', async () => {
    // Arrange
    const { db } = makeUpdateDb([]);
    const repo = createLobbyRepository(db);

    // Act
    const result = await repo.closeLobby(
      mockLobbyRow.id,
      new Date('2026-07-11T10:00:00.000Z'),
    );

    // Assert
    expect(result).toBe(false);
  });

  it('更新に成功したら true を返す', async () => {
    // Arrange
    const closedAt = new Date('2026-07-11T10:00:00.000Z');
    const { db } = makeUpdateDb([{ ...mockLobbyRow, closedAt }]);
    const repo = createLobbyRepository(db);

    // Act
    const result = await repo.closeLobby(mockLobbyRow.id, closedAt);

    // Assert
    expect(result).toBe(true);
  });
});

describe('createGameSessionFromLobby', () => {
  const mockGameSessionRow = {
    id: 'game-session-1',
    hostUserId: 'user-1',
    title: 'テスト募集',
    scenarioName: null,
    description: null,
    location: null,
    maxPlayers: null,
    guestLinkToken: 'new-token',
    isPublished: true,
    openUntil: '2026-07-11',
    scheduledAt: '2026-07-20',
    completedAt: null,
    cancelledAt: null,
    lobbyId: mockLobbyRow.id,
    createdAt: now,
    updatedAt: now,
  };

  const makeCreateDb = () => {
    const memberInsert = { values: vi.fn().mockResolvedValue([]) };
    const sessionInsert = {
      values: vi.fn().mockReturnValue({
        returning: vi.fn().mockResolvedValue([mockGameSessionRow]),
      }),
    };
    let callCount = 0;
    const insert = vi
      .fn()
      .mockImplementation(() =>
        callCount++ === 0 ? sessionInsert : memberInsert,
      );
    const db = { insert } as unknown as Database;
    return { db, sessionInsert, memberInsert };
  };

  it('GameSession に変換して返す', async () => {
    // Arrange
    const { db } = makeCreateDb();
    const repo = createLobbyRepository(db);

    // Act
    const result = await repo.createGameSessionFromLobby({
      lobbyId: mockLobbyRow.id,
      hostUserId: 'user-1',
      title: 'テスト募集',
      scenarioName: null,
      description: null,
      location: null,
      maxPlayers: null,
      scheduledAt: '2026-07-20',
      openUntil: '2026-07-11',
      guestLinkToken: 'new-token',
      members: [{ id: 'member-1', userId: 'user-2', guestName: null }],
    });

    // Assert
    expect(result).toMatchObject({
      id: 'game-session-1',
      title: 'テスト募集',
      lobbyId: mockLobbyRow.id,
      status: 'confirmed',
    });
  });

  it('選出メンバーを lobbyMemberId 付きで game_session_members に INSERT する', async () => {
    // Arrange
    const { db, memberInsert } = makeCreateDb();
    const repo = createLobbyRepository(db);

    // Act
    await repo.createGameSessionFromLobby({
      lobbyId: mockLobbyRow.id,
      hostUserId: 'user-1',
      title: 'テスト募集',
      scenarioName: null,
      description: null,
      location: null,
      maxPlayers: null,
      scheduledAt: '2026-07-20',
      openUntil: '2026-07-11',
      guestLinkToken: 'new-token',
      members: [
        { id: 'member-1', userId: 'user-2', guestName: null },
        { id: 'member-2', userId: null, guestName: 'ゲスト太郎' },
      ],
    });

    // Assert
    expect(memberInsert.values).toHaveBeenCalledWith([
      expect.objectContaining({
        gameSessionId: 'game-session-1',
        userId: 'user-2',
        guestName: null,
        lobbyMemberId: 'member-1',
        characterName: null,
      }),
      expect.objectContaining({
        gameSessionId: 'game-session-1',
        userId: null,
        guestName: 'ゲスト太郎',
        lobbyMemberId: 'member-2',
        characterName: null,
      }),
    ]);
  });
});
