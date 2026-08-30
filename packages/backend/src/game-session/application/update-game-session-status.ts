import type {
  GameSession,
  GameSessionStatusFacts,
  UpdateGameSessionStatusInput,
} from '@taku-biyori/shared';
import {
  GameSessionAction,
  canPerform,
  getGameSessionStatus,
} from '@taku-biyori/shared';

export interface UpdateGameSessionStatusRepository {
  findLobbyId(id: string): Promise<string | null>;
  findHostUserId(id: string): Promise<string | null>;
  findStatusFields(id: string): Promise<GameSessionStatusFacts | null>;
  complete(id: string, completedAt: Date): Promise<GameSession | null>;
  cancel(id: string, cancelledAt: Date): Promise<GameSession | null>;
}

export type UpdateGameSessionStatusResult =
  | { type: 'ok'; gameSession: GameSession }
  | { type: 'notFound' }
  | { type: 'forbidden' }
  | { type: 'invalidTransition' };

// target と、それを許可するポリシー表のアクションの対応。
// v0.2 は cancelled への遷移だけ表を通さずハードコード判定していたが、
// v2 では両方ともここを通す（design-v2 §4-5）
const ACTION_BY_TARGET = {
  completed: GameSessionAction.completeGameSession,
  cancelled: GameSessionAction.cancelGameSession,
} as const;

/**
 * セッションのステータス遷移（design-v2 §6-13-6）。
 *
 * ファクト列（completed_at / cancelled_at）を書き、ステータスは再導出して返す。
 * どちらも終端で逆方向の遷移は無い。v0.2 にあった `open` は廃止した。
 */
export const updateGameSessionStatus = async (
  repo: UpdateGameSessionStatusRepository,
  lobbyId: string,
  id: string,
  userId: string,
  input: UpdateGameSessionStatusInput,
  now: Date = new Date(),
): Promise<UpdateGameSessionStatusResult> => {
  const actualLobbyId = await repo.findLobbyId(id);
  if (actualLobbyId === null) return { type: 'notFound' };
  if (actualLobbyId !== lobbyId) return { type: 'notFound' };

  const hostUserId = await repo.findHostUserId(id);
  if (hostUserId !== userId) return { type: 'forbidden' };

  const facts = await repo.findStatusFields(id);
  if (!facts) return { type: 'notFound' };

  const status = getGameSessionStatus(facts);
  if (!canPerform(ACTION_BY_TARGET[input.status], status, 'host')) {
    return { type: 'invalidTransition' };
  }

  // リポジトリ側は「まだ終端でない行」だけを更新する条件付き UPDATE。
  // 0件なら並行する遷移に負けたということなので、上の判定と同じ結果に寄せる
  const gameSession =
    input.status === 'completed'
      ? await repo.complete(id, now)
      : await repo.cancel(id, now);

  if (!gameSession) return { type: 'invalidTransition' };
  return { type: 'ok', gameSession };
};
