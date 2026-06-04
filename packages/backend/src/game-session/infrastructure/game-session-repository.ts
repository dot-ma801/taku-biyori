import { and, count, eq, exists, or, getTableColumns } from 'drizzle-orm';
import type {
  GameSession,
  GameSessionDetail,
  GameSessionListItem,
  GameSessionMember,
  UpdateGameSessionInput,
} from '@taku-biyori/shared';
import type { Database } from '@/system/infrastructure/database/client';
import {
  gameSessions,
  gameSessionMembers,
} from '@/system/infrastructure/database/game-session-schema';
import { getGameSessionStatus } from '@/game-session/domain/game-session-status';
import type { ListGameSessionsRepository } from '@/game-session/application/list-game-sessions';
import type { CreateGameSessionRepository } from '@/game-session/application/create-game-session';
import type { GetGameSessionRepository } from '@/game-session/application/get-game-session';
import type { UpdateGameSessionRepository } from '@/game-session/application/update-game-session';
import type { DeleteGameSessionRepository } from '@/game-session/application/delete-game-session';

export type GameSessionRepository = ListGameSessionsRepository &
  CreateGameSessionRepository &
  GetGameSessionRepository &
  UpdateGameSessionRepository &
  DeleteGameSessionRepository;

type GameSessionRow = {
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

type ListRow = GameSessionRow & { memberCount: number };

const toDateOrNull = (s: string | null): Date | null =>
  s ? new Date(s) : null;

const toGameSession = (row: GameSessionRow): GameSession => ({
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

const toListItem = (row: ListRow): GameSessionListItem => ({
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

export const createGameSessionRepository = (
  db: Database,
): GameSessionRepository => ({
  async findByUserId(userId: string): Promise<GameSessionListItem[]> {
    const rows = await db
      .select({
        ...getTableColumns(gameSessions),
        memberCount: count(gameSessionMembers.id),
      })
      .from(gameSessions)
      .leftJoin(
        gameSessionMembers,
        eq(gameSessionMembers.gameSessionId, gameSessions.id),
      )
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

    return rows.map((row) =>
      toListItem({
        ...row,
        memberCount: Number(row.memberCount),
      }),
    );
  },

  async findHostUserId(id: string): Promise<string | null> {
    const row = await db
      .select({ hostUserId: gameSessions.hostUserId })
      .from(gameSessions)
      .where(eq(gameSessions.id, id))
      .limit(1);
    return row[0]?.hostUserId ?? null;
  },

  async findDetailById(id: string): Promise<GameSessionDetail | null> {
    const rows = await db
      .select({
        ...getTableColumns(gameSessions),
        memberId: gameSessionMembers.id,
        memberUserId: gameSessionMembers.userId,
        memberGuestName: gameSessionMembers.guestName,
        memberCharacterName: gameSessionMembers.characterName,
        memberCreatedAt: gameSessionMembers.createdAt,
      })
      .from(gameSessions)
      .leftJoin(
        gameSessionMembers,
        eq(gameSessionMembers.gameSessionId, gameSessions.id),
      )
      .where(eq(gameSessions.id, id));

    if (rows.length === 0) return null;

    const first = rows[0]!;
    const gameSession = toGameSession(first);

    const members: GameSessionMember[] = rows
      .filter((r) => r.memberId !== null)
      .map((r) => ({
        id: r.memberId!,
        userId: r.memberUserId,
        guestName: r.memberGuestName,
        characterName: r.memberCharacterName,
        joinedAt: r.memberCreatedAt!.toISOString(),
      }));

    return { ...gameSession, members };
  },

  async updateById(
    id: string,
    input: UpdateGameSessionInput,
  ): Promise<GameSession | null> {
    const result = await db
      .update(gameSessions)
      .set({
        ...(input.title !== undefined && { title: input.title }),
        ...(input.description !== undefined && {
          description: input.description,
        }),
        ...(input.scenarioName !== undefined && {
          scenarioName: input.scenarioName,
        }),
        ...(input.maxMembers !== undefined && { maxPlayers: input.maxMembers }),
        ...(input.openUntil !== undefined && { openUntil: input.openUntil }),
      })
      .where(eq(gameSessions.id, id))
      .returning();

    const session = result[0];
    if (!session) return null;
    return toGameSession(session);
  },

  async deleteById(id: string): Promise<void> {
    await db.delete(gameSessions).where(eq(gameSessions.id, id));
  },

  async createWithHost(params): Promise<GameSession> {
    return db.transaction(async (tx) => {
      const result = await tx
        .insert(gameSessions)
        .values({
          hostUserId: params.hostUserId,
          title: params.title,
          description: params.description ?? null,
          scenarioName: params.scenarioName ?? null,
          maxPlayers: params.maxMembers ?? null,
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

      return toGameSession(session);
    });
  },
});
