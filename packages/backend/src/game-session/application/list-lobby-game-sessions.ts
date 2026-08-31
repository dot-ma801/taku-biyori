import type { GameSessionListItem } from '@taku-biyori/shared';

export interface ListLobbyGameSessionsRepository {
  findLobbyForViewing(
    lobbyId: string,
  ): Promise<{ hostUserId: string; publishedAt: Date | null } | null>;
  findByLobbyId(lobbyId: string): Promise<GameSessionListItem[]>;
}

export type ListLobbyGameSessionsResult =
  | { type: 'ok'; gameSessions: GameSessionListItem[] }
  | { type: 'notFound' }
  | { type: 'forbidden' };

/**
 * ロビー配下の開催一覧（design-v2 §6-5）。
 *
 * **中止・完了も含めて全件返す。** 絞り込みはフロントの仕事で、サーバーが
 * 「次の開催」などを先回りして計算しない（§6-1）。
 */
export const listLobbyGameSessions = async (
  repo: ListLobbyGameSessionsRepository,
  lobbyId: string,
  userId: string | null,
): Promise<ListLobbyGameSessionsResult> => {
  const lobby = await repo.findLobbyForViewing(lobbyId);
  if (!lobby) return { type: 'notFound' };

  // 導出ステータスではなく published_at で判定する（design-v2 §6-13-4）
  if (lobby.publishedAt === null && lobby.hostUserId !== userId) {
    return { type: 'forbidden' };
  }

  const gameSessions = await repo.findByLobbyId(lobbyId);
  return { type: 'ok', gameSessions };
};
