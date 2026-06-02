import { describe, expect, it, vi } from 'vitest';
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
  createdAt: now,
  updatedAt: now,
};

const makeSelectDb = (rows: unknown[]) => {
  const chain = {
    from: vi.fn().mockReturnThis(),
    leftJoin: vi.fn().mockReturnThis(),
    where: vi.fn().mockReturnThis(),
    groupBy: vi.fn().mockResolvedValue(rows),
  };
  return {
    select: vi.fn().mockReturnValue(chain),
  } as unknown as Database;
};

const makeTransactionDb = (sessionRow: unknown) => {
  const memberInsert = { values: vi.fn().mockResolvedValue([]) };
  const sessionInsert = {
    values: vi.fn().mockReturnValue({
      returning: vi.fn().mockResolvedValue([sessionRow]),
    }),
  };
  let callCount = 0;
  const txInsert = vi.fn().mockImplementation(() =>
    callCount++ === 0 ? sessionInsert : memberInsert,
  );
  const tx = { insert: txInsert };
  return {
    db: {
      transaction: vi
        .fn()
        .mockImplementation(
          (fn: (tx: typeof tx) => unknown) => fn(tx),
        ),
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
    const db = makeSelectDb([{ ...mockSessionRow, memberCount: 1 }]);
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
    });
  });

  it('memberCount が文字列で返ってきても number に変換する', async () => {
    // Arrange
    const db = makeSelectDb([{ ...mockSessionRow, memberCount: '3' }]);
    const repo = createGameSessionRepository(db);

    // Act
    const result = await repo.findByUserId('user-1');

    // Assert
    expect(typeof result[0]?.memberCount).toBe('number');
    expect(result[0]?.memberCount).toBe(3);
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
