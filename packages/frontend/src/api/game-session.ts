import type {
  AvailabilityDate,
  BulkUpdateAvailabilityDatesInput,
  CreateAvailabilityDateInput,
  CreateGameSessionInput,
  GameSession,
  GameSessionDetail,
  GameSessionListItem,
  UpdateAvailabilityDateResponseInput,
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
): Promise<AvailabilityDate> {
  return (await apiRequest<AvailabilityDate>(
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

export async function updateGameSessionStatus(
  id: string,
  input: UpdateGameSessionStatusInput,
): Promise<GameSession> {
  return (await apiRequest<GameSession>(`/api/game-sessions/${id}/status`, {
    method: 'PATCH',
    body: input,
  }))!;
}
