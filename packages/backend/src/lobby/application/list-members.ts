import type { LobbyMember } from '@taku-biyori/shared';

export interface ListMembersRepository {
  findLobbyVisibility(
    id: string,
  ): Promise<{ isPublished: boolean; hostUserId: string } | null>;
  findMembersByLobbyId(lobbyId: string): Promise<LobbyMember[]>;
}

export type ListMembersResult =
  | { type: 'ok'; members: LobbyMember[] }
  | { type: 'notFound' }
  | { type: 'forbidden' };

/**
 * 公開済みの募集枠は誰でも参加者一覧を閲覧できる。
 * 非公開（draft）はホストのみ（design-v1.1 §6: `GET .../members` は「公開済みは不要」）。
 */
export const listMembers = async (
  repo: ListMembersRepository,
  lobbyId: string,
  userId: string | null,
): Promise<ListMembersResult> => {
  const visibility = await repo.findLobbyVisibility(lobbyId);
  if (!visibility) return { type: 'notFound' };

  if (!visibility.isPublished && visibility.hostUserId !== userId) {
    return { type: 'forbidden' };
  }

  const members = await repo.findMembersByLobbyId(lobbyId);
  return { type: 'ok', members };
};
