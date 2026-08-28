import type {
  GameSession,
  GameSessionDetail,
  GameSessionListItem,
  GameSessionMember,
  JoinGameSessionInput,
  MyGameSessionPlayMemo,
  SharedGameSessionPlayMemo,
  UpdateGameSessionInput,
  UpdateGameSessionPlayMemoVisibilityInput,
  UpdateGameSessionStatusInput,
  UpdateMemberInput,
  UpsertGameSessionPlayMemoInput,
} from '@taku-biyori/shared';
import { apiRequest } from '@/lib/api-client';

export async function listGameSessions(): Promise<GameSessionListItem[]> {
  return (await apiRequest<GameSessionListItem[]>('/api/game-sessions'))!;
}

export async function getGameSession(id: string): Promise<GameSessionDetail> {
  return (await apiRequest<GameSessionDetail>(`/api/game-sessions/${id}`))!;
}

export async function updateGameSession(
  id: string,
  input: UpdateGameSessionInput,
): Promise<GameSession> {
  return (await apiRequest<GameSession>(`/api/game-sessions/${id}`, {
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
  input: UpdateGameSessionStatusInput,
): Promise<GameSession> {
  return (await apiRequest<GameSession>(`/api/game-sessions/${id}/status`, {
    method: 'PATCH',
    body: input,
  }))!;
}

// ---------- プレイメモ ----------

/**
 * 自分のプレイメモを取得する。
 *
 * メモを一度も書いていなくても 404 にはならず、`updatedAt: null` の空メモが返る
 * （design-v1.2 §8）。呼び出し側に「未作成」の分岐は不要。
 */
export async function getMyPlayMemo(
  gameSessionId: string,
): Promise<MyGameSessionPlayMemo> {
  return (await apiRequest<MyGameSessionPlayMemo>(
    `/api/game-sessions/${gameSessionId}/play-memos/me`,
  ))!;
}

/**
 * 自分のプレイメモの本文を保存する。
 *
 * 卓が完了・中止していると 409（ApiError.status）が返る。
 */
export async function upsertMyPlayMemo(
  gameSessionId: string,
  input: UpsertGameSessionPlayMemoInput,
): Promise<MyGameSessionPlayMemo> {
  return (await apiRequest<MyGameSessionPlayMemo>(
    `/api/game-sessions/${gameSessionId}/play-memos/me`,
    { method: 'PUT', body: input },
  ))!;
}

/**
 * 自分のプレイメモの公開・非公開を切り替える。
 *
 * 本文の保存と違い、完了・中止した卓でも呼べる（切替はステータス非依存。design-v1.2 §4）。
 * 本文を一度も保存していないメモには 404 が返るため、呼び出し側は保存済みのときだけ叩く。
 */
export async function updateMyPlayMemoVisibility(
  gameSessionId: string,
  input: UpdateGameSessionPlayMemoVisibilityInput,
): Promise<MyGameSessionPlayMemo> {
  return (await apiRequest<MyGameSessionPlayMemo>(
    `/api/game-sessions/${gameSessionId}/play-memos/me/visibility`,
    { method: 'PATCH', body: input },
  ))!;
}

/**
 * 卓の公開プレイメモを一覧する。
 *
 * 認証は不要（未ログイン・ゲストでも読める。要求 §3-4）。レスポンスは閲覧者で分岐せず、
 * 自分の公開メモも含めて返る（design-v1.2 §8）。誰のメモかは memberId だけが返るため、
 * 表示名は卓のメンバー一覧と突き合わせて解決する。
 */
export async function listSharedPlayMemos(
  gameSessionId: string,
): Promise<SharedGameSessionPlayMemo[]> {
  return (await apiRequest<SharedGameSessionPlayMemo[]>(
    `/api/game-sessions/${gameSessionId}/play-memos`,
  ))!;
}
