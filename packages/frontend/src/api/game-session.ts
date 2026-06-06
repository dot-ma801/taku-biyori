import type {
  CreateGameSessionInput,
  GameSession,
  GameSessionDetail,
  GameSessionListItem,
  UpdateGameSessionInput,
  UpdateGameSessionStatusInput,
} from '@taku-biyori/shared';
import { apiRequest } from '@/lib/api-client';

export function listGameSessions(): Promise<GameSessionListItem[]> {
  return apiRequest<GameSessionListItem[]>('/api/game-sessions');
}

export function createGameSession(
  input: CreateGameSessionInput,
): Promise<GameSession> {
  return apiRequest<GameSession>('/api/game-sessions', {
    method: 'POST',
    body: input,
  });
}

export function getGameSession(id: string): Promise<GameSessionDetail> {
  return apiRequest<GameSessionDetail>(`/api/game-sessions/${id}`);
}

export function updateGameSession(
  id: string,
  input: UpdateGameSessionInput,
): Promise<GameSession> {
  return apiRequest<GameSession>(`/api/game-sessions/${id}`, {
    method: 'PATCH',
    body: input,
  });
}

export function deleteGameSession(id: string): Promise<void> {
  return apiRequest<void>(`/api/game-sessions/${id}`, { method: 'DELETE' });
}

export function updateGameSessionStatus(
  id: string,
  input: UpdateGameSessionStatusInput,
): Promise<GameSession> {
  return apiRequest<GameSession>(`/api/game-sessions/${id}/status`, {
    method: 'PATCH',
    body: input,
  });
}
