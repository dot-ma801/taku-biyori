import type {
  GameSessionMember,
  JoinGameSessionInput,
} from '@taku-biyori/shared';

export interface JoinGameSessionRepository {
  gameSessionExists(id: string): Promise<boolean>;
  findMemberByUserId(
    gameSessionId: string,
    userId: string,
  ): Promise<string | null>;
  addMember(
    gameSessionId: string,
    userId: string,
    input: JoinGameSessionInput,
  ): Promise<GameSessionMember>;
}

export type JoinGameSessionResult =
  | { type: 'ok'; member: GameSessionMember }
  | { type: 'notFound' }
  | { type: 'alreadyJoined' };

export const joinGameSession = async (
  repo: JoinGameSessionRepository,
  gameSessionId: string,
  userId: string,
  input: JoinGameSessionInput,
): Promise<JoinGameSessionResult> => {
  const exists = await repo.gameSessionExists(gameSessionId);
  if (!exists) return { type: 'notFound' };

  const existingMemberId = await repo.findMemberByUserId(gameSessionId, userId);
  if (existingMemberId !== null) return { type: 'alreadyJoined' };

  const member = await repo.addMember(gameSessionId, userId, input);
  return { type: 'ok', member };
};
