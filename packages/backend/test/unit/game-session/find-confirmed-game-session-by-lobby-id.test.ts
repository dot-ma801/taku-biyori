import { describe, expect, it, vi } from 'vitest';
import { findConfirmedGameSessionByLobbyId } from '@/game-session/infrastructure/find-confirmed-game-session-by-lobby-id';
import type { Database } from '@/system/infrastructure/database/client';

const LOBBY_ID = 'aaaaaaaa-0000-0000-0000-000000000001';

const makeDb = (rows: unknown[]) => {
  const where = vi.fn().mockResolvedValue(rows);
  const leftJoin = vi.fn().mockReturnValue({ where });
  const from = vi.fn().mockReturnValue({ leftJoin });
  const select = vi.fn().mockReturnValue({ from });
  return { db: { select } as unknown as Database, select };
};

describe('findConfirmedGameSessionByLobbyId', () => {
  it('卓 ID と選出メンバーの lobbyMemberId を返す', async () => {
    // Arrange
    const { db } = makeDb([
      { gameSessionId: 'gs-1', lobbyMemberId: 'member-1' },
      { gameSessionId: 'gs-1', lobbyMemberId: 'member-2' },
    ]);

    // Act
    const result = await findConfirmedGameSessionByLobbyId(db, LOBBY_ID);

    // Assert
    expect(result).toEqual({
      id: 'gs-1',
      selectedLobbyMemberIds: ['member-1', 'member-2'],
    });
  });

  it('lobbyMemberId が null の行（メンバー未選出行）は除外される', async () => {
    // Arrange
    const { db } = makeDb([{ gameSessionId: 'gs-1', lobbyMemberId: null }]);

    // Act
    const result = await findConfirmedGameSessionByLobbyId(db, LOBBY_ID);

    // Assert
    expect(result).toEqual({ id: 'gs-1', selectedLobbyMemberIds: [] });
  });

  it('卓が見つからなければ null を返す', async () => {
    // Arrange
    const { db } = makeDb([]);

    // Act
    const result = await findConfirmedGameSessionByLobbyId(db, LOBBY_ID);

    // Assert
    expect(result).toBeNull();
  });

  it('卓 ID が null の行しかなければ null を返す', async () => {
    // Arrange
    const { db } = makeDb([{ gameSessionId: null, lobbyMemberId: null }]);

    // Act
    const result = await findConfirmedGameSessionByLobbyId(db, LOBBY_ID);

    // Assert
    expect(result).toBeNull();
  });
});
