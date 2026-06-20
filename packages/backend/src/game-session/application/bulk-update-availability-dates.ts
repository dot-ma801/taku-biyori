import type {
  AvailabilityDate,
  BulkUpdateAvailabilityDatesInput,
} from '@taku-biyori/shared';
import type { GameSessionHostRepository } from '@/game-session/application/game-session-host-repository';
import type { GameSessionStatusInput } from '@/game-session/domain/game-session-status';

export interface BulkUpdateAvailabilityDatesRepository extends GameSessionHostRepository {
  findStatusFields(id: string): Promise<GameSessionStatusInput | null>;
  replaceAllDates(
    gameSessionId: string,
    dates: string[],
  ): Promise<AvailabilityDate[]>;
}

export type BulkUpdateAvailabilityDatesResult =
  | { type: 'ok'; dates: AvailabilityDate[] }
  | { type: 'notFound' }
  | { type: 'forbidden' }
  | { type: 'conflict' };

export const bulkUpdateAvailabilityDates = async (
  repo: BulkUpdateAvailabilityDatesRepository,
  gameSessionId: string,
  userId: string,
  input: BulkUpdateAvailabilityDatesInput,
): Promise<BulkUpdateAvailabilityDatesResult> => {
  const hostUserId = await repo.findHostUserId(gameSessionId);
  if (hostUserId === null) return { type: 'notFound' };
  if (hostUserId !== userId) return { type: 'forbidden' };

  const fields = await repo.findStatusFields(gameSessionId);
  if (!fields) return { type: 'notFound' };
  if (fields.scheduledAt !== null) return { type: 'conflict' };

  const dates = await repo.replaceAllDates(gameSessionId, input.dates);
  return { type: 'ok', dates };
};
