import type { AvailabilityDate } from '@taku-biyori/shared';

export interface ListAvailabilityDatesRepository {
  gameSessionExists(id: string): Promise<boolean>;
  findByGameSessionId(gameSessionId: string): Promise<AvailabilityDate[]>;
}

export type ListAvailabilityDatesResult =
  | { type: 'ok'; dates: AvailabilityDate[] }
  | { type: 'notFound' };

export const listAvailabilityDates = async (
  repo: ListAvailabilityDatesRepository,
  gameSessionId: string,
): Promise<ListAvailabilityDatesResult> => {
  const exists = await repo.gameSessionExists(gameSessionId);
  if (!exists) return { type: 'notFound' };

  const dates = await repo.findByGameSessionId(gameSessionId);
  return { type: 'ok', dates };
};
