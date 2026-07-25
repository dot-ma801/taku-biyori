import type {
  GameSessionMember,
  GameSessionStatus,
  JoinGameSessionInput,
} from '@taku-biyori/shared';
import { GameSessionAction, canPerform } from '@taku-biyori/shared';

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
  // 参加条件は「公開済み・未完了・実施日当日まで」（design-v1.1 §8）。
  // フロントの参加ボタン表示制御と同じ ACTION_POLICIES を使う。
  if (!canPerform(GameSessionAction.joinSession, status, 'member')) {
    return { type: 'sessionNotOpen' };
  }

  const existingMemberId = await repo.findMemberByUserId(gameSessionId, userId);
  if (existingMemberId !== null) return { type: 'alreadyJoined' };

  const member = await repo.addMember(gameSessionId, userId, input);
  // DB 一意制約違反（同時リクエスト）
  if (member === null) return { type: 'alreadyJoined' };

  return { type: 'ok', member };
};
