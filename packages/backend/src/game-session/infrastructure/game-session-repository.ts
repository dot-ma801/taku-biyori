import {
  and,
  count,
  eq,
  exists,
  isNull,
  or,
  getTableColumns,
} from 'drizzle-orm';
import type {
  AvailabilityDate,
  AvailabilityDateAnswer,
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
  gameSessionCandidates,
  gameSessionAnswers,
} from '@/system/infrastructure/database/game-session-schema';
import { getGameSessionStatus } from '@/game-session/domain/game-session-status';
import type { ListGameSessionsRepository } from '@/game-session/application/list-game-sessions';
import type { CreateGameSessionRepository } from '@/game-session/application/create-game-session';
import type { GetGameSessionRepository } from '@/game-session/application/get-game-session';
import type { UpdateGameSessionRepository } from '@/game-session/application/update-game-session';
import type { DeleteGameSessionRepository } from '@/game-session/application/delete-game-session';
import type { UpdateGameSessionStatusRepository } from '@/game-session/application/update-game-session-status';
import type { ListAvailabilityDatesRepository } from '@/game-session/application/list-availability-dates';
import type { AddAvailabilityDateRepository } from '@/game-session/application/add-availability-date';
import type { DeleteAvailabilityDateRepository } from '@/game-session/application/delete-availability-date';
import type { ConfirmAvailabilityDateRepository } from '@/game-session/application/confirm-availability-date';

export type GameSessionRepository = ListGameSessionsRepository &
  CreateGameSessionRepository &
  GetGameSessionRepository &
  UpdateGameSessionRepository &
  DeleteGameSessionRepository &
  UpdateGameSessionStatusRepository &
  ListAvailabilityDatesRepository &
  AddAvailabilityDateRepository &
  DeleteAvailabilityDateRepository &
  ConfirmAvailabilityDateRepository;

type GameSessionRow = {
  id: string;
  hostUserId: string;
  title: string;
  scenarioName: string | null;
  description: string | null;
  location: string | null;
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
  location: row.location,
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
        ...(input.location !== undefined && { location: input.location }),
        ...(input.maxMembers !== undefined && { maxPlayers: input.maxMembers }),
        ...(input.openUntil !== undefined && { openUntil: input.openUntil }),
        ...(input.scheduledAt !== undefined && {
          scheduledAt: input.scheduledAt,
        }),
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

  async findStatusFields(id: string) {
    const row = await db
      .select({
        isPublished: gameSessions.isPublished,
        openUntil: gameSessions.openUntil,
        scheduledAt: gameSessions.scheduledAt,
        completedAt: gameSessions.completedAt,
      })
      .from(gameSessions)
      .where(eq(gameSessions.id, id))
      .limit(1);

    if (!row[0]) return null;
    const r = row[0];
    return {
      isPublished: r.isPublished,
      openUntil: toDateOrNull(r.openUntil),
      scheduledAt: toDateOrNull(r.scheduledAt),
      completedAt: r.completedAt,
    };
  },

  async publish(id: string): Promise<GameSession | null> {
    const result = await db
      .update(gameSessions)
      .set({ isPublished: true })
      .where(and(eq(gameSessions.id, id), eq(gameSessions.isPublished, false)))
      .returning();

    const session = result[0];
    if (!session) return null;
    return toGameSession(session);
  },

  async complete(id: string, completedAt: Date): Promise<GameSession | null> {
    const result = await db
      .update(gameSessions)
      .set({ completedAt })
      .where(
        and(
          eq(gameSessions.id, id),
          eq(gameSessions.isPublished, true),
          isNull(gameSessions.completedAt),
        ),
      )
      .returning();

    const session = result[0];
    if (!session) return null;
    return toGameSession(session);
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
          location: params.location ?? null,
          maxPlayers: params.maxMembers ?? null,
          openUntil: params.openUntil ?? null,
          scheduledAt: params.scheduledAt ?? null,
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

  async gameSessionExists(id: string): Promise<boolean> {
    const row = await db
      .select({ id: gameSessions.id })
      .from(gameSessions)
      .where(eq(gameSessions.id, id))
      .limit(1);
    return row.length > 0;
  },

  async findByGameSessionId(
    gameSessionId: string,
  ): Promise<AvailabilityDate[]> {
    const rows = await db
      .select({
        candidateId: gameSessionCandidates.id,
        date: gameSessionCandidates.date,
        answerId: gameSessionAnswers.id,
        memberId: gameSessionAnswers.memberId,
        answer: gameSessionAnswers.answer,
        comment: gameSessionAnswers.comment,
      })
      .from(gameSessionCandidates)
      .leftJoin(
        gameSessionAnswers,
        eq(gameSessionAnswers.candidateId, gameSessionCandidates.id),
      )
      .where(eq(gameSessionCandidates.gameSessionId, gameSessionId))
      .orderBy(gameSessionCandidates.date);

    const map = new Map<string, AvailabilityDate>();
    for (const row of rows) {
      if (!map.has(row.candidateId)) {
        map.set(row.candidateId, {
          id: row.candidateId,
          date: row.date,
          answers: [],
        });
      }
      if (row.answerId !== null && row.memberId !== null) {
        const entry = map.get(row.candidateId)!;
        const answerValue = row.answer as AvailabilityDateAnswer['answer'];
        entry.answers.push({
          id: row.answerId,
          memberId: row.memberId,
          answer: answerValue,
          comment: row.comment,
        });
      }
    }

    return [...map.values()];
  },

  async addDate(
    gameSessionId: string,
    date: string,
  ): Promise<AvailabilityDate> {
    const result = await db
      .insert(gameSessionCandidates)
      .values({ gameSessionId, date })
      .returning();

    const row = result[0];
    if (!row) throw new Error('候補日の追加に失敗しました');
    return { id: row.id, date: row.date, answers: [] };
  },

  async findCandidateOwner(
    dateId: string,
  ): Promise<{ gameSessionId: string; date: string } | null> {
    const row = await db
      .select({
        gameSessionId: gameSessionCandidates.gameSessionId,
        date: gameSessionCandidates.date,
      })
      .from(gameSessionCandidates)
      .where(eq(gameSessionCandidates.id, dateId))
      .limit(1);
    return row[0] ?? null;
  },

  async deleteDateById(dateId: string): Promise<void> {
    await db
      .delete(gameSessionCandidates)
      .where(eq(gameSessionCandidates.id, dateId));
  },

  async setScheduledAt(
    gameSessionId: string,
    date: string,
  ): Promise<GameSession | null> {
    const result = await db
      .update(gameSessions)
      .set({ scheduledAt: date })
      .where(eq(gameSessions.id, gameSessionId))
      .returning();

    const session = result[0];
    if (!session) return null;
    return toGameSession(session);
  },
});
