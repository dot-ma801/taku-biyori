/**
 * v0.2 のセッション API。**移行期間中だけ残す一時ファイル。**
 *
 * 新しい経路は `@/api/game-session` にある。ここに残しているのは、まだ載せ替えていない
 * 旧 UI（`features/GameSession/Detail` / `Edit` / `List`）をコンパイル可能に保つためだけで、
 * **叩く先のエンドポイントは backend 側ですでに廃止されている**（issue #115 のタスク5-2）。
 * 旧 UI を置き換える PR で、このファイルごと削除する。
 */
import type {
  LegacyGameSession,
  LegacyGameSessionDetail,
  LegacyGameSessionListItem,
  GameSessionMember,
  JoinGameSessionInput,
  LegacyUpdateGameSessionInput,
  LegacyUpdateGameSessionStatusInput,
  UpdateMemberInput,
} from '@taku-biyori/shared';
import { apiRequest } from '@/lib/api-client';

export async function listGameSessions(): Promise<LegacyGameSessionListItem[]> {
  return (await apiRequest<LegacyGameSessionListItem[]>('/api/game-sessions'))!;
}

export async function getGameSession(
  id: string,
): Promise<LegacyGameSessionDetail> {
  return (await apiRequest<LegacyGameSessionDetail>(
    `/api/game-sessions/${id}`,
  ))!;
}

export async function updateGameSession(
  id: string,
  input: LegacyUpdateGameSessionInput,
): Promise<LegacyGameSession> {
  return (await apiRequest<LegacyGameSession>(`/api/game-sessions/${id}`, {
    method: 'PATCH',
    body: input,
  }))!;
}

export function deleteGameSession(id: string): Promise<void> {
  return apiRequest<void>(`/api/game-sessions/${id}`, { method: 'DELETE' });
}

export async function joinGameSession(
  id: string,
  input: JoinGameSessionInput,
): Promise<GameSessionMember> {
  return (await apiRequest<GameSessionMember>(
    `/api/game-sessions/${id}/members`,
    { method: 'POST', body: input },
  ))!;
}

export function leaveGameSession(id: string, memberId: string): Promise<void> {
  return apiRequest<void>(`/api/game-sessions/${id}/members/${memberId}`, {
    method: 'DELETE',
  });
}

export async function updateMember(
  gameSessionId: string,
  memberId: string,
  input: UpdateMemberInput,
): Promise<GameSessionMember> {
  return (await apiRequest<GameSessionMember>(
    `/api/game-sessions/${gameSessionId}/members/${memberId}`,
    { method: 'PATCH', body: input },
  ))!;
}

export async function updateGameSessionStatus(
  id: string,
  input: LegacyUpdateGameSessionStatusInput,
): Promise<LegacyGameSession> {
  return (await apiRequest<LegacyGameSession>(
    `/api/game-sessions/${id}/status`,
    {
      method: 'PATCH',
      body: input,
    },
  ))!;
}
