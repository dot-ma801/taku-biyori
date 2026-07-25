import { describe, expect, it, vi } from 'vitest';
import { insertGameSessionWithMembers } from '@/game-session/infrastructure/insert-game-session-with-members';
import type { Database } from '@/system/infrastructure/database/client';

const now = new Date('2025-01-01T00:00:00.000Z');
const LOBBY_ID = 'aaaaaaaa-0000-0000-0000-000000000001';

// 「今日」と一致すると status が today になり confirmed を期待するテストが
// 落ちるため、実行時刻から十分離れた未来日を動的に計算する
const farFutureScheduledAt = new Date(Date.now() + 1000 * 60 * 60 * 24 * 365)
  .toISOString()
  .slice(0, 10);

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
  scheduledAt: farFutureScheduledAt,
  completedAt: null,
  cancelledAt: null,
  lobbyId: LOBBY_ID,
  createdAt: now,
  updatedAt: now,
};

const makeDb = () => {
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

const baseParams = {
  lobbyId: LOBBY_ID,
  hostUserId: 'user-1',
  title: 'テスト募集',
  scenarioName: null,
  description: null,
  location: null,
  maxPlayers: null,
  scheduledAt: farFutureScheduledAt,
  guestLinkToken: 'new-token',
  members: [{ id: 'member-1', userId: 'user-2', guestName: null }],
};

describe('insertGameSessionWithMembers', () => {
  it('GameSession に変換して返す', async () => {
    // Arrange
    const { db } = makeDb();

    // Act
    const result = await insertGameSessionWithMembers(db, baseParams);

    // Assert
    expect(result).toMatchObject({
      id: 'game-session-1',
      title: 'テスト募集',
      lobbyId: LOBBY_ID,
      status: 'confirmed',
    });
  });

  it('公開済み（isPublished=true）の卓として INSERT する', async () => {
    // Arrange
    const { db, sessionInsert } = makeDb();

    // Act
    await insertGameSessionWithMembers(db, baseParams);

    // Assert
    expect(sessionInsert.values).toHaveBeenCalledWith(
      expect.objectContaining({
        hostUserId: 'user-1',
        title: 'テスト募集',
        guestLinkToken: 'new-token',
        isPublished: true,
        scheduledAt: farFutureScheduledAt,
        lobbyId: LOBBY_ID,
      }),
    );
  });

  it('メンバーを lobbyMemberId 付きで game_session_members に INSERT する', async () => {
    // Arrange
    const { db, memberInsert } = makeDb();

    // Act
    await insertGameSessionWithMembers(db, {
      ...baseParams,
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

  it('メンバーが空なら members の INSERT を行わない', async () => {
    // Arrange
    const { db, memberInsert } = makeDb();

    // Act
    await insertGameSessionWithMembers(db, { ...baseParams, members: [] });

    // Assert
    expect(memberInsert.values).not.toHaveBeenCalled();
  });

  it('卓の INSERT が行を返さない場合はエラーを投げる', async () => {
    // Arrange
    const insert = vi.fn().mockReturnValue({
      values: vi.fn().mockReturnValue({
        returning: vi.fn().mockResolvedValue([]),
      }),
    });
    const db = { insert } as unknown as Database;

    // Act / Assert
    await expect(insertGameSessionWithMembers(db, baseParams)).rejects.toThrow(
      '卓の作成に失敗しました',
    );
  });
});
