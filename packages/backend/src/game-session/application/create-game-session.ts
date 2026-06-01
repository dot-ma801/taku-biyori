import { randomBytes } from 'node:crypto';
import type { GameSession, CreateGameSessionInput } from '@taku-biyori/shared';
import { getGameSessionStatus } from '../domain/game-session-status';

export type CreatedGameSessionRow = {
  id: string;
  hostUserId: string;
  title: string;
  scenarioName: string | null;
  description: string | null;
  maxPlayers: number | null;
  isPublished: boolean;
  openUntil: string | null;
  scheduledAt: string | null;
  completedAt: Date | null;
  createdAt: Date;
  updatedAt: Date;
};

export interface CreateGameSessionRepository {
  createWithHost(params: {
    hostUserId: string;
    title: string;
    description?: string;
    scenarioName?: string;
    maxPlayers?: number;
    openUntil?: string;
    guestLinkToken: string;
  }): Promise<CreatedGameSessionRow>;
}

const toDateOrNull = (s: string | null): Date | null => (s ? new Date(s) : null);

const toGameSession = (row: CreatedGameSessionRow): GameSession => ({
  id: row.id,
  title: row.title,
  description: row.description,
  scenarioName: row.scenarioName,
  status: getGameSessionStatus({
    isPublished: row.isPublished,
    openUntil: toDateOrNull(row.openUntil),
    scheduledAt: toDateOrNull(row.scheduledAt),
    completedAt: row.completedAt,
  }),
  isPublished: row.isPublished,
  openUntil: row.openUntil,
  scheduledAt: row.scheduledAt,
  completedAt: row.completedAt?.toISOString() ?? null,
  maxMembers: row.maxPlayers,
  createdBy: row.hostUserId,
  createdAt: row.createdAt.toISOString(),
  updatedAt: row.updatedAt.toISOString(),
});

export const createGameSession = async (
  repo: CreateGameSessionRepository,
  userId: string,
  input: CreateGameSessionInput,
): Promise<GameSession> => {
  const guestLinkToken = randomBytes(16).toString('base64url');
  const row = await repo.createWithHost({
    hostUserId: userId,
    title: input.title,
    description: input.description,
    scenarioName: input.scenarioName,
    maxPlayers: input.maxMembers,
    openUntil: input.openUntil,
    guestLinkToken,
  });
  return toGameSession(row);
};
