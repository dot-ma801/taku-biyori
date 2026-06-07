import type {
  AvailabilityDate,
  CreateAvailabilityDateInput,
} from '@taku-biyori/shared';
import type { GameSessionHostRepository } from '@/game-session/application/game-session-host-repository';

export interface AddAvailabilityDateRepository extends GameSessionHostRepository {
  addDate(gameSessionId: string, date: string): Promise<AvailabilityDate>;
}

export type AddAvailabilityDateResult =
  | { type: 'ok'; date: AvailabilityDate }
  | { type: 'notFound' }
  | { type: 'forbidden' };

export const addAvailabilityDate = async (
  repo: AddAvailabilityDateRepository,
  gameSessionId: string,
  userId: string,
  input: CreateAvailabilityDateInput,
): Promise<AddAvailabilityDateResult> => {
  const hostUserId = await repo.findHostUserId(gameSessionId);
  if (hostUserId === null) return { type: 'notFound' };
  if (hostUserId !== userId) return { type: 'forbidden' };

  const date = await repo.addDate(gameSessionId, input.date);
  return { type: 'ok', date };
};
