import type { LobbyMemberLinkRequest } from '@taku-biyori/shared';

export interface ListMemberLinkRequestsRepository {
  findHostUserId(id: string): Promise<string | null>;
  findLinkRequestsByLobbyId(lobbyId: string): Promise<LobbyMemberLinkRequest[]>;
}

export type ListMemberLinkRequestsResult =
  | { type: 'ok'; requests: LobbyMemberLinkRequest[] }
  | { type: 'notFound' }
  | { type: 'forbidden' };

/**
 * 承認待ちの紐づけ申請を一覧する（ADR 0008）。
 * 承認できるのはホストだけなので、一覧もホストに限定する。
 */
export const listMemberLinkRequests = async (
  repo: ListMemberLinkRequestsRepository,
  lobbyId: string,
  userId: string,
): Promise<ListMemberLinkRequestsResult> => {
  const hostUserId = await repo.findHostUserId(lobbyId);
  if (hostUserId === null) return { type: 'notFound' };
  if (hostUserId !== userId) return { type: 'forbidden' };

  const requests = await repo.findLinkRequestsByLobbyId(lobbyId);
  return { type: 'ok', requests };
};
