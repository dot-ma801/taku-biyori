import type { GameSessionHostRepository } from '@/game-session/application/game-session-host-repository';

export interface GetGuestLinkRepository extends GameSessionHostRepository {
  findGuestLinkToken(id: string): Promise<string | null>;
}

export type GetGuestLinkResult =
  | { type: 'ok'; token: string }
  | { type: 'notFound' }
  | { type: 'forbidden' };

export const getGuestLink = async (
  repo: GetGuestLinkRepository,
  id: string,
  userId: string,
): Promise<GetGuestLinkResult> => {
  const hostUserId = await repo.findHostUserId(id);
  if (hostUserId === null) return { type: 'notFound' };
  if (hostUserId !== userId) return { type: 'forbidden' };

  const token = await repo.findGuestLinkToken(id);
  if (token === null) return { type: 'notFound' };

  return { type: 'ok', token };
};
