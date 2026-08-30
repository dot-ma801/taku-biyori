import {
  LobbyStatus,
  type Lobby,
  type UpdateLobbyInput,
} from '@taku-biyori/shared';
import type { LobbyHostRepository } from '@/lobby/application/lobby-host-repository';

export interface UpdateLobbyRepository extends LobbyHostRepository {
  findLobbyStatus(id: string): Promise<LobbyStatus | null>;
  updateById(id: string, input: UpdateLobbyInput): Promise<Lobby | null>;
  /**
   * 更新対象の募集枠行に排他ロックを取り、コールバック内のクエリを 1 トランザクションで実行する。
   * ステータスチェックと updateById を別々のクエリに分けると、その間に並行する
   * updateLobbyStatus が confirmed/cancelled へ遷移させた場合、チェックを素通りして
   * 更新が成功してしまう race condition（TOCTOU）が起きる。deleteLobby と同方針で
   * ロック付きトランザクション境界を application 層から明示的に開く。
   */
  executeWithLock<T>(
    id: string,
    fn: (lockedRepo: UpdateLobbyRepository) => Promise<T>,
  ): Promise<T>;
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
  return repo.executeWithLock(id, async (lockedRepo) => {
    const hostUserId = await lockedRepo.findHostUserId(id);
    if (hostUserId === null) return { type: 'notFound' };
    if (hostUserId !== userId) return { type: 'forbidden' };

    const status = await lockedRepo.findLobbyStatus(id);
    if (status === null) return { type: 'notFound' };
    if (status === LobbyStatus.cancelled) {
      return { type: 'invalidStatus' };
    }

    const lobby = await lockedRepo.updateById(id, input);
    if (!lobby) return { type: 'notFound' };
    return { type: 'ok', lobby };
  });
};
