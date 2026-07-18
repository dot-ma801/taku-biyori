import type {
  BulkUpdateLobbyAvailabilityDatesInput,
  CreateLobbyInput,
  GuestUpdateLobbyAvailabilityDateResponseInput,
  JoinLobbyAsGuestInput,
  JoinLobbyInput,
  Lobby,
  LobbyAvailabilityDate,
  LobbyAvailabilityDateAnswer,
  LobbyDetail,
  LobbyGuestLinkResponse,
  LobbyListItem,
  LobbyMember,
  UpdateLobbyAvailabilityDateResponseInput,
  UpdateLobbyInput,
  UpdateLobbyStatusInput,
} from '@taku-biyori/shared';
import { GUEST_TOKEN_HEADER } from '@taku-biyori/shared';
import { apiRequest } from '@/lib/api-client';

export async function listLobbies(): Promise<LobbyListItem[]> {
  return (await apiRequest<LobbyListItem[]>('/api/lobbies'))!;
}

export async function createLobby(input: CreateLobbyInput): Promise<Lobby> {
  return (await apiRequest<Lobby>('/api/lobbies', {
    method: 'POST',
    body: input,
  }))!;
}

export async function getLobby(id: string): Promise<LobbyDetail> {
  return (await apiRequest<LobbyDetail>(`/api/lobbies/${id}`))!;
}

export async function updateLobby(
  id: string,
  input: UpdateLobbyInput,
): Promise<Lobby> {
  return (await apiRequest<Lobby>(`/api/lobbies/${id}`, {
    method: 'PATCH',
    body: input,
  }))!;
}

export async function listLobbyAvailabilityDates(
  id: string,
): Promise<LobbyAvailabilityDate[]> {
  return (await apiRequest<LobbyAvailabilityDate[]>(
    `/api/lobbies/${id}/availability-dates`,
  ))!;
}

export async function bulkUpdateLobbyAvailabilityDates(
  id: string,
  input: BulkUpdateLobbyAvailabilityDatesInput,
): Promise<LobbyAvailabilityDate[]> {
  return (await apiRequest<LobbyAvailabilityDate[]>(
    `/api/lobbies/${id}/availability-dates`,
    { method: 'PUT', body: input },
  ))!;
}

export async function updateLobbyAvailabilityDateResponse(
  lobbyId: string,
  dateId: string,
  input: UpdateLobbyAvailabilityDateResponseInput,
): Promise<LobbyAvailabilityDateAnswer> {
  return (await apiRequest<LobbyAvailabilityDateAnswer>(
    `/api/lobbies/${lobbyId}/availability-dates/${dateId}/responses`,
    { method: 'PUT', body: input },
  ))!;
}

export async function joinLobby(
  id: string,
  input: JoinLobbyInput,
): Promise<LobbyMember> {
  return (await apiRequest<LobbyMember>(`/api/lobbies/${id}/members`, {
    method: 'POST',
    body: input,
  }))!;
}

export function leaveLobby(id: string, memberId: string): Promise<void> {
  return apiRequest<void>(`/api/lobbies/${id}/members/${memberId}`, {
    method: 'DELETE',
  });
}

export async function updateLobbyStatus(
  id: string,
  input: UpdateLobbyStatusInput,
): Promise<Lobby> {
  return (await apiRequest<Lobby>(`/api/lobbies/${id}/status`, {
    method: 'PATCH',
    body: input,
  }))!;
}

// ---------- ゲスト（完全匿名）フロー ----------

/** ホストがゲスト招待用のトークンを取得する。 */
export async function getLobbyGuestLink(
  id: string,
): Promise<LobbyGuestLinkResponse> {
  return (await apiRequest<LobbyGuestLinkResponse>(
    `/api/lobbies/${id}/guest-link`,
  ))!;
}

/**
 * ゲストとしてロビーに参加する。認証不要で、トークンは Guest-Token ヘッダーで送る。
 */
export async function joinLobbyAsGuest(
  id: string,
  token: string,
  input: JoinLobbyAsGuestInput,
): Promise<LobbyMember> {
  return (await apiRequest<LobbyMember>(`/api/lobbies/${id}/guest-members`, {
    method: 'POST',
    body: input,
    headers: { [GUEST_TOKEN_HEADER]: token },
  }))!;
}

/**
 * ゲストとして日程候補に回答する。認証不要で、トークンは Guest-Token ヘッダーで送る。
 * input には対象ゲスト列を示す memberId を含める。
 */
export async function updateGuestLobbyAvailabilityDateResponse(
  lobbyId: string,
  dateId: string,
  token: string,
  input: GuestUpdateLobbyAvailabilityDateResponseInput,
): Promise<LobbyAvailabilityDateAnswer> {
  return (await apiRequest<LobbyAvailabilityDateAnswer>(
    `/api/lobbies/${lobbyId}/availability-dates/${dateId}/guest-responses`,
    { method: 'PUT', body: input, headers: { [GUEST_TOKEN_HEADER]: token } },
  ))!;
}
