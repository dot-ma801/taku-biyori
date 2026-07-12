import type {
  CreateLobbyInput,
  Lobby,
  LobbyDetail,
  UpdateLobbyInput,
} from '@taku-biyori/shared';
import { apiRequest } from '@/lib/api-client';

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
