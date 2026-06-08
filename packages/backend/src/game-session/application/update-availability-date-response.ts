import type {
  AvailabilityDateAnswer,
  UpdateAvailabilityDateResponseInput,
} from '@taku-biyori/shared';

export interface UpdateAvailabilityDateResponseRepository {
  gameSessionExists(gameSessionId: string): Promise<boolean>;
  findCandidateOwner(
    dateId: string,
  ): Promise<{ gameSessionId: string; date: string } | null>;
  findMemberByUserId(
    gameSessionId: string,
    userId: string,
  ): Promise<string | null>;
  upsertAnswer(
    candidateId: string,
    memberId: string,
    input: UpdateAvailabilityDateResponseInput,
  ): Promise<AvailabilityDateAnswer>;
}

export type UpdateAvailabilityDateResponseResult =
  | { type: 'ok'; answer: AvailabilityDateAnswer }
  | { type: 'notFound' }
  | { type: 'forbidden' };

export const updateAvailabilityDateResponse = async (
  repo: UpdateAvailabilityDateResponseRepository,
  gameSessionId: string,
  dateId: string,
  userId: string,
  input: UpdateAvailabilityDateResponseInput,
): Promise<UpdateAvailabilityDateResponseResult> => {
  const exists = await repo.gameSessionExists(gameSessionId);
  if (!exists) return { type: 'notFound' };

  const candidate = await repo.findCandidateOwner(dateId);
  if (!candidate) return { type: 'notFound' };
  if (candidate.gameSessionId !== gameSessionId) return { type: 'notFound' };

  const memberId = await repo.findMemberByUserId(gameSessionId, userId);
  if (!memberId) return { type: 'forbidden' };

  const answer = await repo.upsertAnswer(dateId, memberId, input);
  return { type: 'ok', answer };
};
