import { randomBytes } from 'node:crypto';
import type { GameSession, CreateGameSessionInput } from '@taku-biyori/shared';

export interface CreateGameSessionRepository {
  createWithHost(params: {
    hostUserId: string;
    title: string;
    description?: string;
    scenarioName?: string;
    location?: string;
    maxMembers?: number;
    openUntil?: string;
    scheduledAt?: string;
    guestLinkToken: string;
  }): Promise<GameSession>;
}

export const createGameSession = async (
  repo: CreateGameSessionRepository,
  userId: string,
  input: CreateGameSessionInput,
): Promise<GameSession> => {
  const guestLinkToken = randomBytes(16).toString('base64url');
  return repo.createWithHost({
    hostUserId: userId,
    title: input.title,
    description: input.description,
    scenarioName: input.scenarioName,
    location: input.location,
    maxMembers: input.maxMembers,
    openUntil: input.openUntil,
    scheduledAt: input.scheduledAt,
    guestLinkToken,
  });
};
