import type { LobbyHostRepository } from '@/lobby/application/lobby-host-repository';

export interface DeleteLobbyRepository extends LobbyHostRepository {
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

    const otherMemberCount = await lockedRepo.countOtherMembers(id, userId);
    if (otherMemberCount > 0) {
      return { type: 'hasMember' };
    }

    await lockedRepo.deleteById(id);
    return { type: 'ok' };
  });
};
