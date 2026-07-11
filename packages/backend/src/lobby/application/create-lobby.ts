import { randomBytes } from 'node:crypto';
import type { Lobby, CreateLobbyInput } from '@taku-biyori/shared';

export interface CreateLobbyRepository {
  createWithHostAndCandidates(params: {
    hostUserId: string;
    title: string;
    description?: string;
    scenarioName?: string;
    location?: string;
    maxPlayers?: number;
    openUntil?: string;
    candidateDates: string[];
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
    candidateDates: input.candidateDates,
    guestLinkToken,
  });
};
