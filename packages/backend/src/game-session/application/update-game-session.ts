import type { GameSession, UpdateGameSessionInput } from '@taku-biyori/shared';
import type { GameSessionStatusFacts } from '@taku-biyori/shared';
import {
  GameSessionAction,
  canPerform,
  getGameSessionStatus,
} from '@taku-biyori/shared';

export interface UpdateGameSessionRepository {
  findLobbyId(id: string): Promise<string | null>;
  findHostUserId(id: string): Promise<string | null>;
  findStatusFields(id: string): Promise<GameSessionStatusFacts | null>;
  updateById(
    id: string,
    input: UpdateGameSessionInput,
  ): Promise<GameSession | null>;
}

export type UpdateGameSessionResult =
  | { type: 'ok'; gameSession: GameSession }
  | { type: 'notFound' }
  | { type: 'forbidden' }
  | { type: 'invalidStatus' };

/**
 * 開催日・上書き項目・当日の連絡事項を更新する（design-v2 §6-13-5）。
 *
 * 上書き項目の `null` は「上書きを解除する」で、キーの省略は「変更しない」。
 * この2つを潰さずリポジトリまで運ぶ。
 */
export const updateGameSession = async (
  repo: UpdateGameSessionRepository,
  lobbyId: string,
  id: string,
  userId: string,
  input: UpdateGameSessionInput,
): Promise<UpdateGameSessionResult> => {
  const actualLobbyId = await repo.findLobbyId(id);
  if (actualLobbyId === null) return { type: 'notFound' };
  // 入れ子パスの代償。存在を漏らさないよう 404 にする（design-v2 §6-5）
  if (actualLobbyId !== lobbyId) return { type: 'notFound' };

  const hostUserId = await repo.findHostUserId(id);
  if (hostUserId !== userId) return { type: 'forbidden' };

  const facts = await repo.findStatusFields(id);
  if (!facts) return { type: 'notFound' };

  const status = getGameSessionStatus(facts);
  if (!canPerform(GameSessionAction.editGameSession, status, 'host')) {
    return { type: 'invalidStatus' };
  }

  const gameSession = await repo.updateById(id, input);
  if (!gameSession) return { type: 'notFound' };

  return { type: 'ok', gameSession };
};
