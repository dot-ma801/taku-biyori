import {
  GameSessionStatus,
  type GameSession,
  type UpdateGameSessionStatusInput,
} from '@taku-biyori/shared';
import type { GameSessionHostRepository } from '@/game-session/application/game-session-host-repository';
import type { GameSessionStatusInput } from '@/game-session/domain/game-session-status';
import { getGameSessionStatus } from '@/game-session/domain/game-session-status';

export interface UpdateGameSessionStatusRepository extends GameSessionHostRepository {
  findStatusFields(id: string): Promise<GameSessionStatusInput | null>;
  publish(id: string): Promise<GameSession | null>;
  complete(id: string, completedAt: Date): Promise<GameSession | null>;
  cancel(id: string, cancelledAt: Date): Promise<GameSession | null>;
}

export type UpdateGameSessionStatusResult =
  | { type: 'ok'; gameSession: GameSession }
  | { type: 'notFound' }
  | { type: 'forbidden' }
  | { type: 'invalidTransition' };

export const updateGameSessionStatus = async (
  repo: UpdateGameSessionStatusRepository,
  id: string,
  userId: string,
  input: UpdateGameSessionStatusInput,
  now: Date = new Date(),
): Promise<UpdateGameSessionStatusResult> => {
  const hostUserId = await repo.findHostUserId(id);
  if (hostUserId === null) return { type: 'notFound' };
  if (hostUserId !== userId) return { type: 'forbidden' };

  const fields = await repo.findStatusFields(id);
  if (!fields) return { type: 'notFound' };

  const currentStatus = getGameSessionStatus(fields, now);

  if (input.status === GameSessionStatus.open) {
    if (currentStatus !== GameSessionStatus.draft)
      return { type: 'invalidTransition' };
    const gameSession = await repo.publish(id);
    if (!gameSession) return { type: 'notFound' };
    return { type: 'ok', gameSession };
  }

  if (input.status === GameSessionStatus.completed) {
    if (currentStatus !== GameSessionStatus.today)
      return { type: 'invalidTransition' };
    const gameSession = await repo.complete(id, now);
    // この時点で findHostUserId / findStatusFields により存在は確認済みのため、
    // ここで null が返るのは基本的に cancel() との並行実行に負けたケース
    // （cancelledAt が先にセットされた）を意味する。すでに終端状態が
    // 確定しているという点で「無効な遷移」であり、404 ではなく 409 として
    // 扱う方が実態に合う。
    if (!gameSession) return { type: 'invalidTransition' };
    return { type: 'ok', gameSession };
  }

  if (input.status === GameSessionStatus.cancelled) {
    if (
      currentStatus !== GameSessionStatus.confirmed &&
      currentStatus !== GameSessionStatus.today
    ) {
      return { type: 'invalidTransition' };
    }
    const gameSession = await repo.cancel(id, now);
    // complete() 側と同様、この null は complete() との並行実行に負けた
    // ケース（completedAt が先にセットされた）を意味するため invalidTransition
    // を返す。
    if (!gameSession) return { type: 'invalidTransition' };
    return { type: 'ok', gameSession };
  }

  return { type: 'invalidTransition' };
};
