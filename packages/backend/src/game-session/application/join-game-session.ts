import type {
  GameSessionMember,
  JoinGameSessionInput,
} from '@taku-biyori/shared';
import { GameSessionStatus } from '@taku-biyori/shared';

export interface JoinGameSessionRepository {
  // null はセッションが存在しないことを表す
  findGameSessionStatus(id: string): Promise<GameSessionStatus | null>;
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
  // null はセッション非存在として扱い、クエリを1回に統合する
  const status = await repo.findGameSessionStatus(gameSessionId);
  if (status === null) return { type: 'notFound' };
  if (status !== GameSessionStatus.open) return { type: 'sessionNotOpen' };

  const existingMemberId = await repo.findMemberByUserId(gameSessionId, userId);
  if (existingMemberId !== null) return { type: 'alreadyJoined' };

  const member = await repo.addMember(gameSessionId, userId, input);
  // DB 一意制約違反（同時リクエスト）
  if (member === null) return { type: 'alreadyJoined' };

  return { type: 'ok', member };
};
