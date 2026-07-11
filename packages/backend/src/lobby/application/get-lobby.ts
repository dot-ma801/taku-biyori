import type { LobbyDetail } from '@taku-biyori/shared';

export interface GetLobbyRepository {
  findDetailById(id: string): Promise<LobbyDetail | null>;
}

export type GetLobbyResult =
  | { type: 'ok'; lobby: LobbyDetail }
  | { type: 'notFound' }
  | { type: 'forbidden' };

export const getLobby = async (
  repo: GetLobbyRepository,
  id: string,
  userId: string | null,
): Promise<GetLobbyResult> => {
  const lobby = await repo.findDetailById(id);
  if (!lobby) return { type: 'notFound' };

  if (!lobby.isPublished && lobby.hostUserId !== userId) {
    return { type: 'forbidden' };
  }

  return { type: 'ok', lobby };
};
