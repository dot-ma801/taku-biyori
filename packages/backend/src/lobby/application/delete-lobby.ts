import type { LobbyHostRepository } from '@/lobby/application/lobby-host-repository';

export interface DeleteLobbyRepository extends LobbyHostRepository {
  /**
   * ホスト以外の参加の件数。**脱退済みも数える**（design-v2 §6-13-3）。
   * 「他人が居た痕跡」があるロビーは削除させない。
   */
  countOtherEntries(id: string, hostUserId: string): Promise<number>;
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

    const otherEntryCount = await lockedRepo.countOtherEntries(id, userId);
    if (otherEntryCount > 0) {
      return { type: 'hasMember' };
    }

    await lockedRepo.deleteById(id);
    return { type: 'ok' };
  });
};
