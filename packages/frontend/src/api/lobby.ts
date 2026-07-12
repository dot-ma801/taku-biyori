import type {
  BulkUpdateLobbyAvailabilityDatesInput,
  CreateLobbyInput,
  Lobby,
  LobbyAvailabilityDate,
  LobbyDetail,
  UpdateLobbyInput,
} from '@taku-biyori/shared';
import { apiRequest } from '@/lib/api-client';

export async function listLobbies(): Promise<Lobby[]> {
  return (await apiRequest<Lobby[]>('/api/lobbies'))!;
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
