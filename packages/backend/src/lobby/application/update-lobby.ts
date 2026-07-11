import {
  LobbyStatus,
  type Lobby,
  type UpdateLobbyInput,
} from '@taku-biyori/shared';
import type { LobbyHostRepository } from '@/lobby/application/lobby-host-repository';

export interface UpdateLobbyRepository extends LobbyHostRepository {
  findLobbyStatus(id: string): Promise<LobbyStatus | null>;
  updateById(id: string, input: UpdateLobbyInput): Promise<Lobby | null>;
}

export type UpdateLobbyResult =
  | { type: 'ok'; lobby: Lobby }
  | { type: 'notFound' }
  | { type: 'forbidden' }
  | { type: 'invalidStatus' };

export const updateLobby = async (
  repo: UpdateLobbyRepository,
  id: string,
  userId: string,
  input: UpdateLobbyInput,
): Promise<UpdateLobbyResult> => {
  const hostUserId = await repo.findHostUserId(id);
  if (hostUserId === null) return { type: 'notFound' };
  if (hostUserId !== userId) return { type: 'forbidden' };

  const status = await repo.findLobbyStatus(id);
  if (status === null) return { type: 'notFound' };
  if (status === LobbyStatus.confirmed || status === LobbyStatus.cancelled) {
    return { type: 'invalidStatus' };
  }

  const lobby = await repo.updateById(id, input);
  if (!lobby) return { type: 'notFound' };
  return { type: 'ok', lobby };
};
