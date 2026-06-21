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
  JoinAsGuestInput,
  JoinGameSessionInput,
  UpdateAvailabilityDateResponseInput,
  UpdateGameSessionInput,
  UpdateMemberInput,
} from '@taku-biyori/shared';
import { GameSessionStatus } from '@taku-biyori/shared';
import type { Database } from '@/system/infrastructure/database/client';
import {
  gameSessions,
  gameSessionMembers,
  gameSessionCandidates,
  gameSessionAnswers,
} from '@/system/infrastructure/database/game-session-schema';
import { user } from '@/system/infrastructure/database/schema';
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
import type { BulkUpdateAvailabilityDatesRepository } from '@/game-session/application/bulk-update-availability-dates';
import type { UpdateAvailabilityDateResponseRepository } from '@/game-session/application/update-availability-date-response';
import type { UpdateGuestAvailabilityDateResponseRepository } from '@/game-session/application/update-guest-availability-date-response';
import type { ListMembersRepository } from '@/game-session/application/list-members';
import type { JoinGameSessionRepository } from '@/game-session/application/join-game-session';
import type { JoinAsGuestRepository } from '@/game-session/application/join-as-guest';
import type { UpdateMemberRepository } from '@/game-session/application/update-member';
import type { LeaveGameSessionRepository } from '@/game-session/application/leave-game-session';
import type { GetGuestLinkRepository } from '@/game-session/application/get-guest-link';
import type { GetGuestLinkPreviewRepository } from '@/game-session/application/get-guest-link-preview';

export type GameSessionRepository = ListGameSessionsRepository &
  CreateGameSessionRepository &
  GetGameSessionRepository &
  UpdateGameSessionRepository &
  DeleteGameSessionRepository &
  UpdateGameSessionStatusRepository &
  ListAvailabilityDatesRepository &
  AddAvailabilityDateRepository &
  DeleteAvailabilityDateRepository &
  ConfirmAvailabilityDateRepository &
  BulkUpdateAvailabilityDatesRepository &
  UpdateAvailabilityDateResponseRepository &
  UpdateGuestAvailabilityDateResponseRepository &
  ListMembersRepository &
  JoinGameSessionRepository &
  JoinAsGuestRepository &
  UpdateMemberRepository &
  LeaveGameSessionRepository &
  GetGuestLinkRepository &
  GetGuestLinkPreviewRepository;

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

  async findGameSessionStatus(id: string): Promise<GameSessionStatus | null> {
    // findStatusFields と同一の DB クエリを共通化して再利用する
    const fields = await this.findStatusFields(id);
    if (!fields) return null;
    return getGameSessionStatus(fields);
  },

  async findDetailById(id: string): Promise<GameSessionDetail | null> {
    const rows = await db
      .select({
        ...getTableColumns(gameSessions),
        memberId: gameSessionMembers.id,
        memberUserId: gameSessionMembers.userId,
        memberUserName: user.name,
        memberGuestName: gameSessionMembers.guestName,
        memberCharacterName: gameSessionMembers.characterName,
        memberCreatedAt: gameSessionMembers.createdAt,
      })
      .from(gameSessions)
      .leftJoin(
        gameSessionMembers,
        eq(gameSessionMembers.gameSessionId, gameSessions.id),
      )
      .leftJoin(user, eq(user.id, gameSessionMembers.userId))
      .where(eq(gameSessions.id, id));

    if (rows.length === 0) return null;

    const first = rows[0]!;
    const gameSession = toGameSession(first);

    const members: GameSessionMember[] = rows
      .filter((r) => r.memberId !== null)
      .map((r) => ({
        id: r.memberId!,
        userId: r.memberUserId,
        userName: r.memberUserName ?? null,
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

  async replaceAllDates(
    gameSessionId: string,
    dates: string[],
  ): Promise<AvailabilityDate[]> {
    return db.transaction(async (tx) => {
      await tx
        .delete(gameSessionCandidates)
        .where(eq(gameSessionCandidates.gameSessionId, gameSessionId));

      if (dates.length === 0) return [];

      const inserted = await tx
        .insert(gameSessionCandidates)
        .values(dates.map((date) => ({ gameSessionId, date })))
        .returning();

      return inserted.map((row) => ({
        id: row.id,
        date: row.date,
        answers: [],
      }));
    });
  },

  async findMemberByUserId(
    gameSessionId: string,
    userId: string,
  ): Promise<string | null> {
    const row = await db
      .select({ id: gameSessionMembers.id })
      .from(gameSessionMembers)
      .where(
        and(
          eq(gameSessionMembers.gameSessionId, gameSessionId),
          eq(gameSessionMembers.userId, userId),
        ),
      )
      .limit(1);
    return row[0]?.id ?? null;
  },

  async findMembersByGameSessionId(
    gameSessionId: string,
  ): Promise<GameSessionMember[]> {
    const rows = await db
      .select({
        id: gameSessionMembers.id,
        userId: gameSessionMembers.userId,
        userName: user.name,
        guestName: gameSessionMembers.guestName,
        characterName: gameSessionMembers.characterName,
        createdAt: gameSessionMembers.createdAt,
      })
      .from(gameSessionMembers)
      .leftJoin(user, eq(user.id, gameSessionMembers.userId))
      .where(eq(gameSessionMembers.gameSessionId, gameSessionId))
      .orderBy(gameSessionMembers.createdAt);

    return rows.map((r) => ({
      id: r.id,
      userId: r.userId,
      userName: r.userName ?? null,
      guestName: r.guestName,
      characterName: r.characterName,
      joinedAt: r.createdAt.toISOString(),
    }));
  },

  async addMember(
    gameSessionId: string,
    userId: string,
    input: JoinGameSessionInput,
  ): Promise<GameSessionMember | null> {
    const result = await db
      .insert(gameSessionMembers)
      .values({
        gameSessionId,
        userId,
        characterName: input.characterName ?? null,
      })
      .onConflictDoNothing()
      .returning();

    // onConflictDoNothing で競合した場合は空配列が返る
    const row = result[0];
    if (!row) return null;

    const userRow = await db
      .select({ name: user.name })
      .from(user)
      .where(eq(user.id, userId))
      .limit(1);

    return {
      id: row.id,
      userId: row.userId,
      userName: userRow[0]?.name ?? null,
      guestName: row.guestName,
      characterName: row.characterName,
      joinedAt: row.createdAt.toISOString(),
    };
  },

  async addGuestMember(
    gameSessionId: string,
    input: JoinAsGuestInput,
  ): Promise<GameSessionMember> {
    const result = await db
      .insert(gameSessionMembers)
      .values({
        gameSessionId,
        userId: null,
        guestName: input.guestName,
        characterName: input.characterName ?? null,
      })
      .returning();

    const row = result[0];
    if (!row) throw new Error('ゲストメンバーの追加に失敗しました');

    return {
      id: row.id,
      userId: null,
      userName: null,
      guestName: row.guestName,
      characterName: row.characterName,
      joinedAt: row.createdAt.toISOString(),
    };
  },

  async findMemberOwner(
    memberId: string,
  ): Promise<{ gameSessionId: string; userId: string | null } | null> {
    const row = await db
      .select({
        gameSessionId: gameSessionMembers.gameSessionId,
        userId: gameSessionMembers.userId,
      })
      .from(gameSessionMembers)
      .where(eq(gameSessionMembers.id, memberId))
      .limit(1);
    return row[0] ?? null;
  },

  async updateMemberById(
    memberId: string,
    input: UpdateMemberInput,
  ): Promise<GameSessionMember> {
    const result = await db
      .update(gameSessionMembers)
      .set({
        ...(input.characterName !== undefined && {
          characterName: input.characterName,
        }),
      })
      .where(eq(gameSessionMembers.id, memberId))
      .returning();

    const row = result[0];
    if (!row) throw new Error('メンバーの更新に失敗しました');

    const userRow = row.userId
      ? await db
          .select({ name: user.name })
          .from(user)
          .where(eq(user.id, row.userId))
          .limit(1)
      : [];

    return {
      id: row.id,
      userId: row.userId,
      userName: userRow[0]?.name ?? null,
      guestName: row.guestName,
      characterName: row.characterName,
      joinedAt: row.createdAt.toISOString(),
    };
  },

  async deleteMemberById(memberId: string): Promise<void> {
    await db
      .delete(gameSessionMembers)
      .where(eq(gameSessionMembers.id, memberId));
  },

  async findGuestLinkInfo(
    id: string,
  ): Promise<{ hostUserId: string; token: string } | null> {
    const row = await db
      .select({
        hostUserId: gameSessions.hostUserId,
        guestLinkToken: gameSessions.guestLinkToken,
      })
      .from(gameSessions)
      .where(eq(gameSessions.id, id))
      .limit(1);
    if (!row[0]) return null;
    return { hostUserId: row[0].hostUserId, token: row[0].guestLinkToken };
  },

  async findGuestLinkToken(id: string): Promise<string | null> {
    const row = await db
      .select({ guestLinkToken: gameSessions.guestLinkToken })
      .from(gameSessions)
      .where(eq(gameSessions.id, id))
      .limit(1);
    return row[0]?.guestLinkToken ?? null;
  },

  async isGuestMember(
    gameSessionId: string,
    memberId: string,
  ): Promise<boolean> {
    const row = await db
      .select({ userId: gameSessionMembers.userId })
      .from(gameSessionMembers)
      .where(
        and(
          eq(gameSessionMembers.id, memberId),
          eq(gameSessionMembers.gameSessionId, gameSessionId),
          isNull(gameSessionMembers.userId),
        ),
      )
      .limit(1);
    return row[0] !== undefined;
  },

  async findByGuestLinkToken(token: string): Promise<GameSession | null> {
    const row = await db
      .select()
      .from(gameSessions)
      .where(eq(gameSessions.guestLinkToken, token))
      .limit(1);
    if (!row[0]) return null;
    return toGameSession(row[0]);
  },

  async upsertAnswer(
    candidateId: string,
    memberId: string,
    input: UpdateAvailabilityDateResponseInput,
  ): Promise<AvailabilityDateAnswer> {
    const result = await db
      .insert(gameSessionAnswers)
      .values({
        candidateId,
        memberId,
        answer: input.answer,
        comment: input.comment ?? null,
      })
      .onConflictDoUpdate({
        target: [gameSessionAnswers.candidateId, gameSessionAnswers.memberId],
        set: {
          answer: input.answer,
          comment: input.comment ?? null,
        },
      })
      .returning();

    const row = result[0];
    if (!row) throw new Error('回答の登録に失敗しました');

    const answerValue = row.answer as AvailabilityDateAnswer['answer'];
    return {
      id: row.id,
      memberId: row.memberId,
      answer: answerValue,
      comment: row.comment,
    };
  },
});
