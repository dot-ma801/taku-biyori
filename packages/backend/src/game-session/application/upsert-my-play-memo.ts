import type {
  GameSessionPlayMemo,
  UpsertGameSessionPlayMemoInput,
} from '@taku-biyori/shared';
import { LegacyGameSessionAction, canPerformLegacy } from '@taku-biyori/shared';
import type { GameSessionHostRepository } from '@/game-session/application/game-session-host-repository';
import type { GameSessionStatusInput } from '@/game-session/domain/game-session-status';
import { getGameSessionStatus } from '@/game-session/domain/game-session-status';

export interface UpsertMyPlayMemoRepository extends GameSessionHostRepository {
  findStatusFields(id: string): Promise<GameSessionStatusInput | null>;
  findMemberByUserId(
    gameSessionId: string,
    userId: string,
  ): Promise<string | null>;
  upsertPlayMemo(memberId: string, body: string): Promise<GameSessionPlayMemo>;
}

export type UpsertMyPlayMemoResult =
  | { type: 'ok'; playMemo: GameSessionPlayMemo }
  | { type: 'notFound' }
  | { type: 'forbidden' }
  | { type: 'statusLocked' };

/**
 * 自分のプレイメモの本文を作成・更新する（design-v1.2 §5）。
 *
 * 終端状態（完了・中止）では本文を編集できない。判定は `editPlayMemo` ポリシーに委ねる。
 */
export const upsertMyPlayMemo = async (
  repo: UpsertMyPlayMemoRepository,
  gameSessionId: string,
  userId: string,
  input: UpsertGameSessionPlayMemoInput,
  now: Date = new Date(),
): Promise<UpsertMyPlayMemoResult> => {
  const fields = await repo.findStatusFields(gameSessionId);
  if (!fields) return { type: 'notFound' };

  // 認証ユーザー ID でメンバー行を引く。ゲストは user_id = null のため
  // 構造上ヒットせず、ゲスト除外の専用分岐は不要（design-v1.2 §4）。
  // ステータス判定より先に置き、非メンバーに卓の状態を推測させない
  const memberId = await repo.findMemberByUserId(gameSessionId, userId);
  if (memberId === null) return { type: 'forbidden' };

  const hostUserId = await repo.findHostUserId(gameSessionId);
  const role = hostUserId === userId ? 'host' : 'member';
  const status = getGameSessionStatus(fields, now);

  if (!canPerformLegacy(LegacyGameSessionAction.editPlayMemo, status, role)) {
    return { type: 'statusLocked' };
  }

  const playMemo = await repo.upsertPlayMemo(memberId, input.body);
  return { type: 'ok', playMemo };
};
