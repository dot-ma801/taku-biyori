import { eq } from 'drizzle-orm';
import type { Database } from '@/system/infrastructure/database/client';
import {
  gameSessions,
  gameSessionMembers,
} from '@/system/infrastructure/database/game-session-schema';

export type ConfirmedGameSession = {
  id: string;
  /** 卓に引き継がれたメンバーの出自（募集枠メンバーID） */
  selectedLobbyMemberIds: string[];
};

/**
 * 募集枠から確定した卓と、そこへ引き継がれたメンバーの出自を取得する。
 *
 * 募集枠のインフラ層が卓のテーブル定義を直接触ると機能をまたいだ依存になるため、
 * 卓側の関数として公開する（PR #74 レビュー合意）。
 */
export const findConfirmedGameSessionByLobbyId = async (
  db: Database,
  lobbyId: string,
): Promise<ConfirmedGameSession | null> => {
  const rows = await db
    .select({
      gameSessionId: gameSessions.id,
      lobbyMemberId: gameSessionMembers.lobbyMemberId,
    })
    .from(gameSessions)
    .leftJoin(
      gameSessionMembers,
      eq(gameSessionMembers.gameSessionId, gameSessions.id),
    )
    .where(eq(gameSessions.lobbyId, lobbyId));

  const id = rows[0]?.gameSessionId;
  if (id == null) return null;

  return {
    id,
    selectedLobbyMemberIds: rows
      .filter((r) => r.lobbyMemberId !== null)
      .map((r) => r.lobbyMemberId!),
  };
};
