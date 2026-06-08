import type { GameSessionMember } from '@taku-biyori/shared';

export interface ListMembersRepository {
  gameSessionExists(id: string): Promise<boolean>;
  findMembersByGameSessionId(
    gameSessionId: string,
  ): Promise<GameSessionMember[]>;
}

export type ListMembersResult =
  | { type: 'ok'; members: GameSessionMember[] }
  | { type: 'notFound' };

export const listMembers = async (
  repo: ListMembersRepository,
  gameSessionId: string,
): Promise<ListMembersResult> => {
  const exists = await repo.gameSessionExists(gameSessionId);
  if (!exists) return { type: 'notFound' };

  const members = await repo.findMembersByGameSessionId(gameSessionId);
  return { type: 'ok', members };
};
