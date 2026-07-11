import type { LobbyMember, JoinLobbyInput } from '@taku-biyori/shared';
import { LobbyStatus } from '@taku-biyori/shared';

export interface JoinLobbyRepository {
  // null は募集枠が存在しないことを表す
  findLobbyStatus(id: string): Promise<LobbyStatus | null>;
  findMemberByUserId(lobbyId: string, userId: string): Promise<string | null>;
  // null は DB 一意制約違反（同時リクエストによる重複）を表す
  addMember(
    lobbyId: string,
    userId: string,
    input: JoinLobbyInput,
  ): Promise<LobbyMember | null>;
}

export type JoinLobbyResult =
  | { type: 'ok'; member: LobbyMember }
  | { type: 'notFound' }
  | { type: 'lobbyNotOpen' }
  | { type: 'alreadyJoined' };

export const joinLobby = async (
  repo: JoinLobbyRepository,
  lobbyId: string,
  userId: string,
  input: JoinLobbyInput,
): Promise<JoinLobbyResult> => {
  // null は募集枠非存在として扱い、クエリを1回に統合する
  const status = await repo.findLobbyStatus(lobbyId);
  if (status === null) return { type: 'notFound' };
  if (status !== LobbyStatus.open) return { type: 'lobbyNotOpen' };

  const existingMemberId = await repo.findMemberByUserId(lobbyId, userId);
  if (existingMemberId !== null) return { type: 'alreadyJoined' };

  const member = await repo.addMember(lobbyId, userId, input);
  // DB 一意制約違反（同時リクエスト）
  if (member === null) return { type: 'alreadyJoined' };

  return { type: 'ok', member };
};
