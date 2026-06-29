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
  const hostUserId = await repo.findHostUserId(id);
  if (hostUserId === null) {
    return { type: 'notFound' };
  }
  if (hostUserId !== userId) {
    return { type: 'forbidden' };
  }

  const status = await repo.findGameSessionStatus(id);
  if (status === null) {
    return { type: 'notFound' };
  }
  if (!canPerform(GameSessionAction.deleteSession, status, 'host')) {
    return { type: 'invalidStatus' };
  }

  const otherMemberCount = await repo.countOtherMembers(id, userId);
  if (otherMemberCount > 0) {
    return { type: 'hasMember' };
  }

  await repo.deleteById(id);
  return { type: 'ok' };
};
