import type { LinkRequestOwner } from '@/lobby/application/approve-member-link';

export interface DeleteMemberLinkRequestRepository {
  findHostUserId(id: string): Promise<string | null>;
  findLinkRequest(requestId: string): Promise<LinkRequestOwner | null>;
  deleteLinkRequest(requestId: string): Promise<void>;
}

export type DeleteMemberLinkRequestResult =
  | { type: 'ok' }
  | { type: 'notFound' }
  | { type: 'forbidden' };

/**
 * 紐づけ申請を取り消す（ADR 0008）。
 * ホストによる却下と、申請者本人による取り下げの両方を担う。
 */
export const deleteMemberLinkRequest = async (
  repo: DeleteMemberLinkRequestRepository,
  lobbyId: string,
  requestId: string,
  userId: string,
): Promise<DeleteMemberLinkRequestResult> => {
  const request = await repo.findLinkRequest(requestId);
  if (!request || request.lobbyId !== lobbyId) return { type: 'notFound' };

  const hostUserId = await repo.findHostUserId(lobbyId);
  const isHost = hostUserId === userId;
  const isRequester = request.requestedUserId === userId;
  if (!isHost && !isRequester) return { type: 'forbidden' };

  await repo.deleteLinkRequest(requestId);
  return { type: 'ok' };
};
