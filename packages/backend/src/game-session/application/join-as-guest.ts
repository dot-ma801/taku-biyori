import type { GameSessionMember, JoinAsGuestInput } from '@taku-biyori/shared';

export interface JoinAsGuestRepository {
  gameSessionExists(id: string): Promise<boolean>;
  addGuestMember(
    gameSessionId: string,
    input: JoinAsGuestInput,
  ): Promise<GameSessionMember>;
}

export type JoinAsGuestResult =
  | { type: 'ok'; member: GameSessionMember }
  | { type: 'notFound' };

export const joinAsGuest = async (
  repo: JoinAsGuestRepository,
  gameSessionId: string,
  input: JoinAsGuestInput,
): Promise<JoinAsGuestResult> => {
  const exists = await repo.gameSessionExists(gameSessionId);
  if (!exists) return { type: 'notFound' };

  const member = await repo.addGuestMember(gameSessionId, input);
  return { type: 'ok', member };
};
