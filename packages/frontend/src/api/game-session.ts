import type {
  AvailabilityDate,
  BulkUpdateAvailabilityDatesInput,
  CreateAvailabilityDateInput,
  CreateGameSessionInput,
  GameSession,
  GameSessionDetail,
  GameSessionListItem,
  UpdateGameSessionInput,
  UpdateGameSessionStatusInput,
} from '@taku-biyori/shared';
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
  sessionId: string,
): Promise<AvailabilityDate[]> {
  return (await apiRequest<AvailabilityDate[]>(
    `/api/game-sessions/${sessionId}/availability-dates`,
  ))!;
}

export async function addAvailabilityDate(
  sessionId: string,
  input: CreateAvailabilityDateInput,
): Promise<AvailabilityDate> {
  return (await apiRequest<AvailabilityDate>(
    `/api/game-sessions/${sessionId}/availability-dates`,
    { method: 'POST', body: input },
  ))!;
}

export async function bulkUpdateAvailabilityDates(
  sessionId: string,
  input: BulkUpdateAvailabilityDatesInput,
): Promise<AvailabilityDate[]> {
  return (await apiRequest<AvailabilityDate[]>(
    `/api/game-sessions/${sessionId}/availability-dates`,
    { method: 'PUT', body: input },
  ))!;
}

export function deleteAvailabilityDate(
  sessionId: string,
  dateId: string,
): Promise<void> {
  return apiRequest<void>(
    `/api/game-sessions/${sessionId}/availability-dates/${dateId}`,
    { method: 'DELETE' },
  );
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
