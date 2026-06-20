import type {
  AvailabilityDate,
  CreateAvailabilityDateInput,
} from '@taku-biyori/shared';
import { GameSessionStatus } from '@taku-biyori/shared';
import type { GameSessionHostRepository } from '@/game-session/application/game-session-host-repository';
import type { GameSessionStatusInput } from '@/game-session/domain/game-session-status';
import { getGameSessionStatus } from '@/game-session/domain/game-session-status';

const ALLOWED_STATUSES = new Set<GameSessionStatus>([
  GameSessionStatus.draft,
  GameSessionStatus.open,
  GameSessionStatus.scheduling,
]);

export interface AddAvailabilityDateRepository extends GameSessionHostRepository {
  findStatusFields(id: string): Promise<GameSessionStatusInput | null>;
  addDate(gameSessionId: string, date: string): Promise<AvailabilityDate>;
}

export type AddAvailabilityDateResult =
  | { type: 'ok'; date: AvailabilityDate }
  | { type: 'notFound' }
  | { type: 'forbidden' }
  | { type: 'conflict' };

export const addAvailabilityDate = async (
  repo: AddAvailabilityDateRepository,
  gameSessionId: string,
  userId: string,
  input: CreateAvailabilityDateInput,
): Promise<AddAvailabilityDateResult> => {
  const hostUserId = await repo.findHostUserId(gameSessionId);
  if (hostUserId === null) return { type: 'notFound' };
  if (hostUserId !== userId) return { type: 'forbidden' };

  const fields = await repo.findStatusFields(gameSessionId);
  if (!fields) return { type: 'notFound' };
  if (!ALLOWED_STATUSES.has(getGameSessionStatus(fields)))
    return { type: 'conflict' };

  const date = await repo.addDate(gameSessionId, input.date);
  return { type: 'ok', date };
};
