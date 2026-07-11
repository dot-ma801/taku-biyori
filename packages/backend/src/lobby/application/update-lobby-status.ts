import {
  LobbyStatus,
  type Lobby,
  type UpdateLobbyStatusInput,
} from '@taku-biyori/shared';
import type { LobbyHostRepository } from '@/lobby/application/lobby-host-repository';
import type { LobbyStatusInput } from '@/lobby/domain/lobby-status';
import { getLobbyStatus } from '@/lobby/domain/lobby-status';

export interface UpdateLobbyStatusRepository extends LobbyHostRepository {
  findStatusFields(id: string): Promise<LobbyStatusInput | null>;
  publish(id: string): Promise<Lobby | null>;
  cancel(id: string): Promise<Lobby | null>;
}

export type UpdateLobbyStatusResult =
  | { type: 'ok'; lobby: Lobby }
  | { type: 'notFound' }
  | { type: 'forbidden' }
  | { type: 'invalidTransition' };

export const updateLobbyStatus = async (
  repo: UpdateLobbyStatusRepository,
  id: string,
  userId: string,
  input: UpdateLobbyStatusInput,
  now: Date = new Date(),
): Promise<UpdateLobbyStatusResult> => {
  const hostUserId = await repo.findHostUserId(id);
  if (hostUserId === null) return { type: 'notFound' };
  if (hostUserId !== userId) return { type: 'forbidden' };

  const fields = await repo.findStatusFields(id);
  if (!fields) return { type: 'notFound' };

  const currentStatus = getLobbyStatus(fields, now);

  // 条件付き UPDATE が 0 行（null）だったとき、行が残っているなら
  // 並行する遷移（公開・確定・中止）に先を越されたケースなので invalidTransition、
  // 行ごと消えているなら notFound を返す。
  const resolveZeroRowUpdate = async (): Promise<UpdateLobbyStatusResult> => {
    const stillExists = (await repo.findHostUserId(id)) !== null;
    return stillExists ? { type: 'invalidTransition' } : { type: 'notFound' };
  };

  if (input.status === LobbyStatus.open) {
    if (currentStatus !== LobbyStatus.draft) {
      return { type: 'invalidTransition' };
    }
    const lobby = await repo.publish(id);
    if (!lobby) return resolveZeroRowUpdate();
    return { type: 'ok', lobby };
  }

  if (input.status === LobbyStatus.cancelled) {
    if (
      currentStatus !== LobbyStatus.draft &&
      currentStatus !== LobbyStatus.open &&
      currentStatus !== LobbyStatus.scheduling
    ) {
      return { type: 'invalidTransition' };
    }
    const lobby = await repo.cancel(id);
    if (!lobby) return resolveZeroRowUpdate();
    return { type: 'ok', lobby };
  }

  return { type: 'invalidTransition' };
};
