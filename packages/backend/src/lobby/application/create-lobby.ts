import { randomBytes } from 'node:crypto';
import type { Lobby, CreateLobbyInput } from '@taku-biyori/shared';
import { normalizeDateNote } from '@taku-biyori/shared';
import type { CandidateDateEntry } from '@/lobby/domain/candidate-date-diff';

export interface CreateLobbyRepository {
  createWithHostAndCandidates(params: {
    hostUserId: string;
    title: string;
    description?: string;
    scenarioName?: string;
    location?: string;
    maxPlayers?: number;
    openUntil?: string;
    candidateDates: CandidateDateEntry[];
    guestLinkToken: string;
  }): Promise<Lobby>;
}

export const createLobby = async (
  repo: CreateLobbyRepository,
  userId: string,
  input: CreateLobbyInput,
): Promise<Lobby> => {
  const guestLinkToken = randomBytes(16).toString('base64url');
  return repo.createWithHostAndCandidates({
    hostUserId: userId,
    title: input.title,
    description: input.description,
    scenarioName: input.scenarioName,
    location: input.location,
    maxPlayers: input.maxPlayers,
    openUntil: input.openUntil,
    // ひとことは空白のみを null に寄せてから渡す（DB に空文字を残さない）
    candidateDates: (input.candidateDates ?? []).map((entry) => ({
      date: entry.date,
      dateNote: normalizeDateNote(entry.dateNote),
    })),
    guestLinkToken,
  });
};
