import type {
  GameSessionMember,
  JoinGameSessionInput,
} from '@taku-biyori/shared';

export interface JoinGameSessionRepository {
  gameSessionExists(id: string): Promise<boolean>;
  findGameSessionStatus(id: string): Promise<string | null>;
  findMemberByUserId(
    gameSessionId: string,
    userId: string,
  ): Promise<string | null>;
  // null は DB 一意制約違反（同時リクエストによる重複）を表す
  addMember(
    gameSessionId: string,
    userId: string,
    input: JoinGameSessionInput,
  ): Promise<GameSessionMember | null>;
}

export type JoinGameSessionResult =
  | { type: 'ok'; member: GameSessionMember }
  | { type: 'notFound' }
  | { type: 'sessionNotOpen' }
  | { type: 'alreadyJoined' };

export const joinGameSession = async (
  repo: JoinGameSessionRepository,
  gameSessionId: string,
  userId: string,
  input: JoinGameSessionInput,
): Promise<JoinGameSessionResult> => {
  const exists = await repo.gameSessionExists(gameSessionId);
  if (!exists) return { type: 'notFound' };

  const status = await repo.findGameSessionStatus(gameSessionId);
  if (status !== 'open') return { type: 'sessionNotOpen' };

  const existingMemberId = await repo.findMemberByUserId(gameSessionId, userId);
  if (existingMemberId !== null) return { type: 'alreadyJoined' };

  const member = await repo.addMember(gameSessionId, userId, input);
  // DB 一意制約違反（同時リクエスト）
  if (member === null) return { type: 'alreadyJoined' };

  return { type: 'ok', member };
};
