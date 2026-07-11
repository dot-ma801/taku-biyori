import { LobbyStatus } from '@taku-biyori/shared';
import type { LobbyHostRepository } from '@/lobby/application/lobby-host-repository';

export interface DeleteLobbyRepository extends LobbyHostRepository {
  findLobbyStatus(id: string): Promise<LobbyStatus | null>;
  countOtherMembers(id: string, hostUserId: string): Promise<number>;
  deleteById(id: string): Promise<void>;
  /**
   * 削除対象の募集枠行に排他ロックを取り、コールバック内のクエリを 1 トランザクションで実行する。
   * 「条件チェック → 削除」を別々のクエリに分けると TOCTOU race condition が起きるため、
   * application 層からロック付きトランザクション境界を明示的に開く
   * （既存 game-session の executeWithLock と同方針）。
   */
  executeWithLock<T>(
    id: string,
    fn: (lockedRepo: DeleteLobbyRepository) => Promise<T>,
  ): Promise<T>;
}

export type DeleteLobbyResult =
  | { type: 'ok' }
  | { type: 'notFound' }
  | { type: 'forbidden' }
  | { type: 'invalidStatus' }
  | { type: 'hasMember' };

export const deleteLobby = async (
  repo: DeleteLobbyRepository,
  id: string,
  userId: string,
): Promise<DeleteLobbyResult> => {
  return repo.executeWithLock(id, async (lockedRepo) => {
    const hostUserId = await lockedRepo.findHostUserId(id);
    if (hostUserId === null) {
      return { type: 'notFound' };
    }
    if (hostUserId !== userId) {
      return { type: 'forbidden' };
    }

    const status = await lockedRepo.findLobbyStatus(id);
    if (status === null) {
      return { type: 'notFound' };
    }
    // 確定済み（closed_at あり）の募集枠は削除不可（卓の出自リンクを保持するため）。
    // 中止済み（cancelled）は削除可能。
    if (status === LobbyStatus.confirmed) {
      return { type: 'invalidStatus' };
    }

    const otherMemberCount = await lockedRepo.countOtherMembers(id, userId);
    if (otherMemberCount > 0) {
      return { type: 'hasMember' };
    }

    await lockedRepo.deleteById(id);
    return { type: 'ok' };
  });
};
