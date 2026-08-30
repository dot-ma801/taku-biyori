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
  LobbyEntry,
  UpdateLobbyAvailabilityDateResponseInput,
  UpdateLobbyInput,
  UpdateLobbyStatusInput,
} from '@taku-biyori/shared';
import { GUEST_TOKEN_HEADER } from '@taku-biyori/shared';
import { apiRequest } from '@/lib/api-client';
import type {
  LobbyDetailModel,
  LobbyEntryModel,
  LobbyListItemModel,
  LobbyModel,
} from '@/models/lobby';
import {
  toLobbyDetailModel,
  toLobbyEntryModel,
  toLobbyListItemModel,
  toLobbyModel,
} from '@/models/lobby';

// この層が DTO と model の境界。ここより内側（composable / component）は
// `@taku-biyori/shared` のレスポンス型を見ない（issue #113 の規約）。

export async function listLobbies(): Promise<LobbyListItemModel[]> {
  const dto = (await apiRequest<LobbyListItem[]>('/api/lobbies'))!;
  return dto.map(toLobbyListItemModel);
}

export async function createLobby(
  input: CreateLobbyInput,
): Promise<LobbyModel> {
  const dto = (await apiRequest<Lobby>('/api/lobbies', {
    method: 'POST',
    body: input,
  }))!;
  return toLobbyModel(dto);
}

export async function getLobby(id: string): Promise<LobbyDetailModel> {
  const dto = (await apiRequest<LobbyDetail>(`/api/lobbies/${id}`))!;
  return toLobbyDetailModel(dto);
}

export async function updateLobby(
  id: string,
  input: UpdateLobbyInput,
): Promise<LobbyModel> {
  const dto = (await apiRequest<Lobby>(`/api/lobbies/${id}`, {
    method: 'PATCH',
    body: input,
  }))!;
  return toLobbyModel(dto);
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
): Promise<LobbyEntryModel> {
  const dto = (await apiRequest<LobbyEntry>(`/api/lobbies/${id}/entries`, {
    method: 'POST',
    body: input,
  }))!;
  return toLobbyEntryModel(dto);
}

export function leaveLobby(id: string, entryId: string): Promise<void> {
  return apiRequest<void>(`/api/lobbies/${id}/entries/${entryId}`, {
    method: 'DELETE',
  });
}

export async function updateLobbyStatus(
  id: string,
  input: UpdateLobbyStatusInput,
): Promise<LobbyModel> {
  const dto = (await apiRequest<Lobby>(`/api/lobbies/${id}/status`, {
    method: 'PATCH',
    body: input,
  }))!;
  return toLobbyModel(dto);
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
): Promise<LobbyEntryModel> {
  const dto = (await apiRequest<LobbyEntry>(
    `/api/lobbies/${id}/guest-entries`,
    {
      method: 'POST',
      body: input,
      headers: { [GUEST_TOKEN_HEADER]: token },
    },
  ))!;
  return toLobbyEntryModel(dto);
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
