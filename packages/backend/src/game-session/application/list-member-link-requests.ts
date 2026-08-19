import type { GameSessionMemberLinkRequest } from '@taku-biyori/shared';

export interface ListMemberLinkRequestsRepository {
  findHostUserId(id: string): Promise<string | null>;
  findLinkRequestsByGameSessionId(
    gameSessionId: string,
  ): Promise<GameSessionMemberLinkRequest[]>;
}

export type ListMemberLinkRequestsResult =
  | { type: 'ok'; requests: GameSessionMemberLinkRequest[] }
  | { type: 'notFound' }
  | { type: 'forbidden' };

/**
 * 承認待ちの紐づけ申請を一覧する（ADR 0008）。
 * 承認できるのはホストだけなので、一覧もホストに限定する。
 */
export const listMemberLinkRequests = async (
  repo: ListMemberLinkRequestsRepository,
  gameSessionId: string,
  userId: string,
): Promise<ListMemberLinkRequestsResult> => {
  const hostUserId = await repo.findHostUserId(gameSessionId);
  if (hostUserId === null) return { type: 'notFound' };
  if (hostUserId !== userId) return { type: 'forbidden' };

  const requests = await repo.findLinkRequestsByGameSessionId(gameSessionId);
  return { type: 'ok', requests };
};
