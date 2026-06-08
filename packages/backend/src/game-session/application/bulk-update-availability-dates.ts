import type {
  AvailabilityDate,
  BulkUpdateAvailabilityDatesInput,
} from '@taku-biyori/shared';
import type { GameSessionHostRepository } from '@/game-session/application/game-session-host-repository';

export interface BulkUpdateAvailabilityDatesRepository extends GameSessionHostRepository {
  replaceAllDates(
    gameSessionId: string,
    dates: string[],
  ): Promise<AvailabilityDate[]>;
}

export type BulkUpdateAvailabilityDatesResult =
  | { type: 'ok'; dates: AvailabilityDate[] }
  | { type: 'notFound' }
  | { type: 'forbidden' };

export const bulkUpdateAvailabilityDates = async (
  repo: BulkUpdateAvailabilityDatesRepository,
  gameSessionId: string,
  userId: string,
  input: BulkUpdateAvailabilityDatesInput,
): Promise<BulkUpdateAvailabilityDatesResult> => {
  const hostUserId = await repo.findHostUserId(gameSessionId);
  if (hostUserId === null) return { type: 'notFound' };
  if (hostUserId !== userId) return { type: 'forbidden' };

  const dates = await repo.replaceAllDates(gameSessionId, input.dates);
  return { type: 'ok', dates };
};
