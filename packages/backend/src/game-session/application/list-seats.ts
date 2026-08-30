import type { LobbyStatus, Seat } from '@taku-biyori/shared';
import { LobbyStatus as LobbyStatusEnum } from '@taku-biyori/shared';

export interface ListSeatsRepository {
  findLobbyId(id: string): Promise<string | null>;
  findLobbyForViewing(
    lobbyId: string,
  ): Promise<{ hostUserId: string; status: LobbyStatus } | null>;
  findSeatsByGameSessionId(gameSessionId: string): Promise<Seat[]>;
}

export type ListSeatsResult =
  | { type: 'ok'; seats: Seat[] }
  | { type: 'notFound' }
  | { type: 'forbidden' };

/**
 * 着席者一覧（design-v2 §6-6）。`seatedAt` 昇順。
 *
 * seats テーブルは2つの FK だけになったが、レスポンスには LobbyEntry を JOIN した
 * 表示名が現れる。フロントが着席者を描くのに毎回 entries を引き当てなくて済むようにするため。
 */
export const listSeats = async (
  repo: ListSeatsRepository,
  lobbyId: string,
  gameSessionId: string,
  userId: string | null,
): Promise<ListSeatsResult> => {
  const actualLobbyId = await repo.findLobbyId(gameSessionId);
  if (actualLobbyId === null) return { type: 'notFound' };
  if (actualLobbyId !== lobbyId) return { type: 'notFound' };

  const lobby = await repo.findLobbyForViewing(actualLobbyId);
  if (!lobby) return { type: 'notFound' };

  const isDraft = lobby.status === LobbyStatusEnum.draft;
  if (isDraft && lobby.hostUserId !== userId) return { type: 'forbidden' };

  const seats = await repo.findSeatsByGameSessionId(gameSessionId);
  return { type: 'ok', seats };
};
