import {
  GameSessionAction,
  GameSessionStatus,
  canPerform,
} from '@taku-biyori/shared';
import type { GameSessionHostRepository } from '@/game-session/application/game-session-host-repository';

export interface DeleteGameSessionRepository extends GameSessionHostRepository {
  findGameSessionStatus(id: string): Promise<GameSessionStatus | null>;
  countOtherMembers(id: string, hostUserId: string): Promise<number>;
  deleteById(id: string): Promise<void>;
  /**
   * 削除対象のセッション行に排他ロックを取り、コールバック内のクエリを 1 トランザクションで実行する。
   * 「条件チェック → 削除」を別々のクエリに分けると、両者の間に他リクエストが
   * メンバー追加・状態変更・先行削除を行った場合、古い読み取りを根拠に削除してしまう
   * race condition（TOCTOU）が起きる。これを防ぐためにロック付きトランザクション境界を
   * application 層から明示的に開く。
   */
  executeWithLock<T>(
    id: string,
    fn: (lockedRepo: DeleteGameSessionRepository) => Promise<T>,
  ): Promise<T>;
}

export type DeleteGameSessionResult =
  | { type: 'ok' }
  | { type: 'notFound' }
  | { type: 'forbidden' }
  | { type: 'invalidStatus' }
  | { type: 'hasMember' };

export const deleteGameSession = async (
  repo: DeleteGameSessionRepository,
  id: string,
  userId: string,
): Promise<DeleteGameSessionResult> => {
  return repo.executeWithLock(id, async (lockedRepo) => {
    const hostUserId = await lockedRepo.findHostUserId(id);
    if (hostUserId === null) {
      return { type: 'notFound' };
    }
    if (hostUserId !== userId) {
      return { type: 'forbidden' };
    }

    const status = await lockedRepo.findGameSessionStatus(id);
    if (status === null) {
      return { type: 'notFound' };
    }
    if (!canPerform(GameSessionAction.deleteSession, status, 'host')) {
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
