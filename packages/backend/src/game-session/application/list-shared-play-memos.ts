import type { SharedGameSessionPlayMemo } from '@taku-biyori/shared';
import { canViewSharedPlayMemos } from '@taku-biyori/shared';
import type { GameSessionHostRepository } from '@/game-session/application/game-session-host-repository';
import type { GameSessionStatusInput } from '@/game-session/domain/game-session-status';
import { getGameSessionStatus } from '@/game-session/domain/game-session-status';

export interface ListSharedPlayMemosRepository extends GameSessionHostRepository {
  findStatusFields(id: string): Promise<GameSessionStatusInput | null>;
  findSharedPlayMemos(
    gameSessionId: string,
  ): Promise<SharedGameSessionPlayMemo[]>;
}

export type ListSharedPlayMemosResult =
  | { type: 'ok'; playMemos: SharedGameSessionPlayMemo[] }
  | { type: 'notFound' }
  | { type: 'forbidden' };

/**
 * 卓の公開済みプレイメモを一覧する（design-v1.2 §4・§5）。
 *
 * 返す内容は「卓が完了・中止 かつ shared_at != null」だけで決まり、**閲覧者に依存しない**。
 * 閲覧者自身の公開メモも含めて返す（分岐のある権限フィルタは漏洩バグの温床になるため、
 * 「自分のを除く」のような閲覧者による分岐を作らない）。
 *
 * ⚠️ 卓そのものの公開制御を先に噛ませる点が要。非公開のまま中止された卓は
 * `cancelled_at` が `draft` より優先されるため `cancelled` に導出される。
 * 素朴に「完了・中止ならメモを返す」と書くと、非公開卓のメモが第三者に読める。
 */
export const listSharedPlayMemos = async (
  repo: ListSharedPlayMemosRepository,
  gameSessionId: string,
  userId: string | null,
  now: Date = new Date(),
): Promise<ListSharedPlayMemosResult> => {
  const fields = await repo.findStatusFields(gameSessionId);
  if (!fields) return { type: 'notFound' };

  // 卓の閲覧制御は既存の getGameSession と同一にする（design-v1.2 §4 手順2）
  if (!fields.isPublished) {
    const hostUserId = await repo.findHostUserId(gameSessionId);
    if (hostUserId !== userId) return { type: 'forbidden' };
  }

  const status = getGameSessionStatus(fields, now);
  if (!canViewSharedPlayMemos(status)) return { type: 'ok', playMemos: [] };

  const playMemos = await repo.findSharedPlayMemos(gameSessionId);
  return { type: 'ok', playMemos };
};
