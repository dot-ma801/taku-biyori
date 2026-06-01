import { and, count, eq, exists, or, getTableColumns } from 'drizzle-orm';
import type { Database } from '../../system/infrastructure/database/client';
import {
  gameSessions,
  gameSessionMembers,
} from '../../system/infrastructure/database/game-session-schema';
import type {
  ListGameSessionsRepository,
  GameSessionRow,
} from '../application/list-game-sessions';
import type {
  CreateGameSessionRepository,
  CreatedGameSessionRow,
} from '../application/create-game-session';

export type GameSessionRepository = ListGameSessionsRepository & CreateGameSessionRepository;

export const createGameSessionRepository = (db: Database): GameSessionRepository => ({
  async findByUserId(userId: string): Promise<GameSessionRow[]> {
    const rows = await db
      .select({
        ...getTableColumns(gameSessions),
        memberCount: count(gameSessionMembers.id),
      })
      .from(gameSessions)
      .leftJoin(gameSessionMembers, eq(gameSessionMembers.gameSessionId, gameSessions.id))
      .where(
        or(
          eq(gameSessions.hostUserId, userId),
          exists(
            db
              .select({ id: gameSessionMembers.id })
              .from(gameSessionMembers)
              .where(
                and(
                  eq(gameSessionMembers.gameSessionId, gameSessions.id),
                  eq(gameSessionMembers.userId, userId),
                ),
              ),
          ),
        ),
      )
      .groupBy(gameSessions.id);

    return rows.map((row) => ({
      id: row.id,
      hostUserId: row.hostUserId,
      title: row.title,
      scenarioName: row.scenarioName,
      isPublished: row.isPublished,
      openUntil: row.openUntil,
      scheduledAt: row.scheduledAt,
      completedAt: row.completedAt,
      createdAt: row.createdAt,
      updatedAt: row.updatedAt,
      memberCount: Number(row.memberCount),
    }));
  },

  async createWithHost(params): Promise<CreatedGameSessionRow> {
    return db.transaction(async (tx) => {
      const result = await tx
        .insert(gameSessions)
        .values({
          hostUserId: params.hostUserId,
          title: params.title,
          description: params.description ?? null,
          scenarioName: params.scenarioName ?? null,
          maxPlayers: params.maxPlayers ?? null,
          openUntil: params.openUntil ?? null,
          guestLinkToken: params.guestLinkToken,
          isPublished: false,
        })
        .returning();

      const session = result[0];
      if (!session) throw new Error('セッションの作成に失敗しました');

      await tx.insert(gameSessionMembers).values({
        gameSessionId: session.id,
        userId: params.hostUserId,
      });

      return session;
    });
  },
});
