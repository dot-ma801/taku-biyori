import type { GameSessionListItem } from '@taku-biyori/shared';
import { getGameSessionStatus } from '../domain/game-session-status';

export type GameSessionRow = {
  id: string;
  hostUserId: string;
  title: string;
  scenarioName: string | null;
  isPublished: boolean;
  openUntil: string | null;
  scheduledAt: string | null;
  completedAt: Date | null;
  createdAt: Date;
  updatedAt: Date;
  memberCount: number;
};

export interface ListGameSessionsRepository {
  findByUserId(userId: string): Promise<GameSessionRow[]>;
}

const toDateOrNull = (s: string | null): Date | null => (s ? new Date(s) : null);

const toListItem = (row: GameSessionRow): GameSessionListItem => ({
  id: row.id,
  title: row.title,
  scenarioName: row.scenarioName,
  status: getGameSessionStatus({
    isPublished: row.isPublished,
    openUntil: toDateOrNull(row.openUntil),
    scheduledAt: toDateOrNull(row.scheduledAt),
    completedAt: row.completedAt,
  }),
  isPublished: row.isPublished,
  openUntil: row.openUntil,
  memberCount: row.memberCount,
  scheduledAt: row.scheduledAt,
  createdAt: row.createdAt.toISOString(),
  updatedAt: row.updatedAt.toISOString(),
});

export const listGameSessions = async (
  repo: ListGameSessionsRepository,
  userId: string,
): Promise<GameSessionListItem[]> => {
  const rows = await repo.findByUserId(userId);
  return rows.map(toListItem);
};
