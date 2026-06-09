export interface GetGuestLinkRepository {
  findGuestLinkInfo(
    id: string,
  ): Promise<{ hostUserId: string; token: string } | null>;
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
  const info = await repo.findGuestLinkInfo(id);
  if (!info) return { type: 'notFound' };
  if (info.hostUserId !== userId) return { type: 'forbidden' };
  return { type: 'ok', token: info.token };
};
