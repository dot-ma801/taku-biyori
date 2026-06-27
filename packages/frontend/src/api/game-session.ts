import type {
  AvailabilityDate,
  AvailabilityDateAnswer,
  BulkUpdateAvailabilityDatesInput,
  CreateAvailabilityDateInput,
  CreateGameSessionInput,
  GameSession,
  GameSessionDetail,
  GameSessionListItem,
  GameSessionMember,
  GuestLinkResponse,
  GuestUpdateAvailabilityDateResponseInput,
  JoinAsGuestInput,
  JoinGameSessionInput,
  UpdateAvailabilityDateResponseInput,
  UpdateGameSessionInput,
  UpdateGameSessionStatusInput,
  UpdateMemberInput,
} from '@taku-biyori/shared';
import { GUEST_TOKEN_HEADER } from '@taku-biyori/shared';
import { apiRequest } from '@/lib/api-client';

export async function listGameSessions(): Promise<GameSessionListItem[]> {
  return (await apiRequest<GameSessionListItem[]>('/api/game-sessions'))!;
}

export async function createGameSession(
  input: CreateGameSessionInput,
): Promise<GameSession> {
  return (await apiRequest<GameSession>('/api/game-sessions', {
    method: 'POST',
    body: input,
  }))!;
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

export async function listAvailabilityDates(
  gameSessionId: string,
): Promise<AvailabilityDate[]> {
  return (await apiRequest<AvailabilityDate[]>(
    `/api/game-sessions/${gameSessionId}/availability-dates`,
  ))!;
}

export async function addAvailabilityDate(
  gameSessionId: string,
  input: CreateAvailabilityDateInput,
): Promise<AvailabilityDate> {
  return (await apiRequest<AvailabilityDate>(
    `/api/game-sessions/${gameSessionId}/availability-dates`,
    { method: 'POST', body: input },
  ))!;
}

export async function bulkUpdateAvailabilityDates(
  gameSessionId: string,
  input: BulkUpdateAvailabilityDatesInput,
): Promise<AvailabilityDate[]> {
  return (await apiRequest<AvailabilityDate[]>(
    `/api/game-sessions/${gameSessionId}/availability-dates`,
    { method: 'PUT', body: input },
  ))!;
}

export async function updateAvailabilityDateResponse(
  gameSessionId: string,
  dateId: string,
  input: UpdateAvailabilityDateResponseInput,
): Promise<AvailabilityDateAnswer> {
  return (await apiRequest<AvailabilityDateAnswer>(
    `/api/game-sessions/${gameSessionId}/availability-dates/${dateId}/responses`,
    { method: 'PUT', body: input },
  ))!;
}

export function deleteAvailabilityDate(
  gameSessionId: string,
  dateId: string,
): Promise<void> {
  return apiRequest<void>(
    `/api/game-sessions/${gameSessionId}/availability-dates/${dateId}`,
    { method: 'DELETE' },
  );
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

export async function confirmAvailabilityDate(
  gameSessionId: string,
  dateId: string,
): Promise<GameSession> {
  return (await apiRequest<GameSession>(
    `/api/game-sessions/${gameSessionId}/availability-dates/${dateId}/confirm`,
    { method: 'POST' },
  ))!;
}

// ---------- ゲスト（完全匿名）フロー ----------

/** ホストがゲスト招待用のトークンを取得する。 */
export async function getGuestLink(
  gameSessionId: string,
): Promise<GuestLinkResponse> {
  return (await apiRequest<GuestLinkResponse>(
    `/api/game-sessions/${gameSessionId}/guest-link`,
  ))!;
}

/**
 * ゲストとして卓に参加する。認証不要で、トークンは Guest-Token ヘッダーで送る。
 */
export async function joinAsGuest(
  gameSessionId: string,
  token: string,
  input: JoinAsGuestInput,
): Promise<GameSessionMember> {
  return (await apiRequest<GameSessionMember>(
    `/api/game-sessions/${gameSessionId}/guest-members`,
    { method: 'POST', body: input, headers: { [GUEST_TOKEN_HEADER]: token } },
  ))!;
}

/**
 * ゲストとして日程候補に回答する。認証不要で、トークンは Guest-Token ヘッダーで送る。
 * input には対象ゲスト列を示す memberId を含める。
 */
export async function updateGuestAvailabilityDateResponse(
  gameSessionId: string,
  dateId: string,
  token: string,
  input: GuestUpdateAvailabilityDateResponseInput,
): Promise<AvailabilityDateAnswer> {
  return (await apiRequest<AvailabilityDateAnswer>(
    `/api/game-sessions/${gameSessionId}/availability-dates/${dateId}/guest-responses`,
    { method: 'PUT', body: input, headers: { [GUEST_TOKEN_HEADER]: token } },
  ))!;
}
