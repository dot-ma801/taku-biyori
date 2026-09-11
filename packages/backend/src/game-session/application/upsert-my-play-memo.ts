import type {
  GameSessionPlayMemo,
  UpsertGameSessionPlayMemoInput,
} from '@taku-biyori/shared';
import type { GameSessionStatusFacts } from '@taku-biyori/shared';
import {
  GameSessionAction,
  canPerform,
  getGameSessionStatus,
  todayDateString,
} from '@taku-biyori/shared';
import type { GameSessionHostRepository } from '@/game-session/application/game-session-host-repository';

export interface UpsertMyPlayMemoRepository extends GameSessionHostRepository {
  findLobbyId(id: string): Promise<string | null>;
  findStatusFields(id: string): Promise<GameSessionStatusFacts | null>;
  findSeatByUserId(
    gameSessionId: string,
    userId: string,
  ): Promise<string | null>;
  upsertPlayMemo(seatId: string, body: string): Promise<GameSessionPlayMemo>;
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
  lobbyId: string,
  gameSessionId: string,
  userId: string,
  input: UpsertGameSessionPlayMemoInput,
  today: string = todayDateString(),
): Promise<UpsertMyPlayMemoResult> => {
  // URL のロビーがこの開催のロビーでなければ 404（入れ子のパスは親も検証する）
  const actualLobbyId = await repo.findLobbyId(gameSessionId);
  if (actualLobbyId === null || actualLobbyId !== lobbyId) {
    return { type: 'notFound' };
  }

  const fields = await repo.findStatusFields(gameSessionId);
  if (!fields) return { type: 'notFound' };

  // 認証ユーザー ID で着席を引く。ゲストは LobbyEntry の user_id = null のため
  // 構造上ヒットせず、ゲスト除外の専用分岐は不要（design-v1.2 §4）。
  // ステータス判定より先に置き、着席していない人に開催の状態を推測させない
  const seatId = await repo.findSeatByUserId(gameSessionId, userId);
  if (seatId === null) return { type: 'forbidden' };

  const hostUserId = await repo.findHostUserId(gameSessionId);
  const role = hostUserId === userId ? 'host' : 'member';
  const status = getGameSessionStatus(fields, today);

  if (!canPerform(GameSessionAction.editSeatPlayMemo, status, role)) {
    return { type: 'statusLocked' };
  }

  const playMemo = await repo.upsertPlayMemo(seatId, input.body);
  return { type: 'ok', playMemo };
};
