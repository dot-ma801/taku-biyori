import {
  and,
  count,
  eq,
  exists,
  isNull,
  or,
  sql,
  getTableColumns,
} from 'drizzle-orm';
import type {
  Lobby,
  LobbyDetail,
  LobbyListItem,
  LobbyMember,
  LobbyAvailabilityDate,
  LobbyAvailabilityDateAnswer,
  JoinLobbyInput,
  JoinLobbyAsGuestInput,
  UpdateLobbyInput,
  UpdateLobbyAvailabilityDateResponseInput,
} from '@taku-biyori/shared';
import { LobbyStatus } from '@taku-biyori/shared';
import type { Database } from '@/system/infrastructure/database/client';
import {
  lobbies,
  lobbyMembers,
  lobbyCandidates,
  lobbyAnswers,
} from '@/system/infrastructure/database/lobby-schema';
import { user } from '@/system/infrastructure/database/schema';
import { getLobbyStatus } from '@/lobby/domain/lobby-status';
import type { ListLobbiesRepository } from '@/lobby/application/list-lobbies';
import type { CreateLobbyRepository } from '@/lobby/application/create-lobby';
import type { GetLobbyRepository } from '@/lobby/application/get-lobby';
import type { UpdateLobbyRepository } from '@/lobby/application/update-lobby';
import type { DeleteLobbyRepository } from '@/lobby/application/delete-lobby';
import type { UpdateLobbyStatusRepository } from '@/lobby/application/update-lobby-status';
import type { ListMembersRepository } from '@/lobby/application/list-members';
import type { JoinLobbyRepository } from '@/lobby/application/join-lobby';
import type { JoinAsGuestRepository } from '@/lobby/application/join-as-guest';
import type { LeaveLobbyRepository } from '@/lobby/application/leave-lobby';
import type { GetGuestLinkRepository } from '@/lobby/application/get-guest-link';
import type { ListAvailabilityDatesRepository } from '@/lobby/application/list-availability-dates';
import type { AddAvailabilityDateRepository } from '@/lobby/application/add-availability-date';
import type { BulkUpdateAvailabilityDatesRepository } from '@/lobby/application/bulk-update-availability-dates';
import type { DeleteAvailabilityDateRepository } from '@/lobby/application/delete-availability-date';
import type { UpdateAvailabilityDateResponseRepository } from '@/lobby/application/update-availability-date-response';
import type { UpdateGuestAvailabilityDateResponseRepository } from '@/lobby/application/update-guest-availability-date-response';

export type LobbyRepository = ListLobbiesRepository &
  CreateLobbyRepository &
  GetLobbyRepository &
  UpdateLobbyRepository &
  DeleteLobbyRepository &
  UpdateLobbyStatusRepository &
  ListMembersRepository &
  JoinLobbyRepository &
  JoinAsGuestRepository &
  LeaveLobbyRepository &
  GetGuestLinkRepository &
  ListAvailabilityDatesRepository &
  AddAvailabilityDateRepository &
  BulkUpdateAvailabilityDatesRepository &
  DeleteAvailabilityDateRepository &
  UpdateAvailabilityDateResponseRepository &
  UpdateGuestAvailabilityDateResponseRepository;

type LobbyRow = {
  id: string;
  hostUserId: string;
  title: string;
  scenarioName: string | null;
  description: string | null;
  location: string | null;
  maxPlayers: number | null;
  isPublished: boolean;
  openUntil: string | null;
  closedAt: Date | null;
  cancelledAt: Date | null;
  createdAt: Date;
  updatedAt: Date;
};

type ListRow = LobbyRow & {
  memberCount: number;
  userMemberId: string | null;
};

const toDateOrNull = (s: string | null): Date | null =>
  s ? new Date(s) : null;

const toLobby = (row: LobbyRow): Lobby => ({
  id: row.id,
  title: row.title,
  description: row.description,
  scenarioName: row.scenarioName,
  location: row.location,
  status: getLobbyStatus({
    isPublished: row.isPublished,
    openUntil: toDateOrNull(row.openUntil),
    closedAt: row.closedAt,
    cancelledAt: row.cancelledAt,
  }),
  isPublished: row.isPublished,
  maxPlayers: row.maxPlayers,
  openUntil: row.openUntil,
  closedAt: row.closedAt?.toISOString() ?? null,
  cancelledAt: row.cancelledAt?.toISOString() ?? null,
  hostUserId: row.hostUserId,
  createdAt: row.createdAt.toISOString(),
  updatedAt: row.updatedAt.toISOString(),
});

const toListItem = (row: ListRow, userId: string): LobbyListItem => ({
  id: row.id,
  title: row.title,
  scenarioName: row.scenarioName,
  status: getLobbyStatus({
    isPublished: row.isPublished,
    openUntil: toDateOrNull(row.openUntil),
    closedAt: row.closedAt,
    cancelledAt: row.cancelledAt,
  }),
  isPublished: row.isPublished,
  openUntil: row.openUntil,
  memberCount: row.memberCount,
  maxPlayers: row.maxPlayers,
  createdAt: row.createdAt.toISOString(),
  updatedAt: row.updatedAt.toISOString(),
  role:
    row.hostUserId === userId
      ? 'host'
      : row.userMemberId !== null
        ? 'member'
        : null,
});

export const createLobbyRepository = (db: Database): LobbyRepository => ({
  async findByUserId(userId: string): Promise<LobbyListItem[]> {
    const rows = await db
      .select({
        ...getTableColumns(lobbies),
        memberCount: count(lobbyMembers.id),
        userMemberId: sql<string | null>`(
          SELECT id FROM lobby.lobby_members
          WHERE lobby_id = ${lobbies.id}
            AND user_id = ${userId}
          LIMIT 1
        )`,
      })
      .from(lobbies)
      .leftJoin(lobbyMembers, eq(lobbyMembers.lobbyId, lobbies.id))
      .where(
        or(
          eq(lobbies.hostUserId, userId),
          exists(
            db
              .select({ id: lobbyMembers.id })
              .from(lobbyMembers)
              .where(
                and(
                  eq(lobbyMembers.lobbyId, lobbies.id),
                  eq(lobbyMembers.userId, userId),
                ),
              ),
          ),
        ),
      )
      .groupBy(lobbies.id);

    return rows.map((row) =>
      toListItem({ ...row, memberCount: Number(row.memberCount) }, userId),
    );
  },

  async findHostUserId(id: string): Promise<string | null> {
    const row = await db
      .select({ hostUserId: lobbies.hostUserId })
      .from(lobbies)
      .where(eq(lobbies.id, id))
      .limit(1);
    return row[0]?.hostUserId ?? null;
  },

  async findLobbyStatus(id: string): Promise<LobbyStatus | null> {
    const fields = await this.findStatusFields(id);
    if (!fields) return null;
    return getLobbyStatus(fields);
  },

  async findDetailById(id: string): Promise<LobbyDetail | null> {
    const rows = await db
      .select({
        ...getTableColumns(lobbies),
        memberId: lobbyMembers.id,
        memberUserId: lobbyMembers.userId,
        memberUserName: user.name,
        memberGuestName: lobbyMembers.guestName,
        memberCreatedAt: lobbyMembers.createdAt,
      })
      .from(lobbies)
      .leftJoin(lobbyMembers, eq(lobbyMembers.lobbyId, lobbies.id))
      .leftJoin(user, eq(user.id, lobbyMembers.userId))
      .where(eq(lobbies.id, id));

    if (rows.length === 0) return null;

    const first = rows[0]!;
    const lobby = toLobby(first);

    const members: LobbyMember[] = rows
      .filter((r) => r.memberId !== null)
      .map((r) => ({
        id: r.memberId!,
        userId: r.memberUserId,
        userName: r.memberUserName ?? null,
        guestName: r.memberGuestName,
        joinedAt: r.memberCreatedAt!.toISOString(),
      }));

    return { ...lobby, members };
  },

  async updateById(id: string, input: UpdateLobbyInput): Promise<Lobby | null> {
    const result = await db
      .update(lobbies)
      .set({
        ...(input.title !== undefined && { title: input.title }),
        ...(input.description !== undefined && {
          description: input.description,
        }),
        ...(input.scenarioName !== undefined && {
          scenarioName: input.scenarioName,
        }),
        ...(input.location !== undefined && { location: input.location }),
        ...(input.maxPlayers !== undefined && { maxPlayers: input.maxPlayers }),
        ...(input.openUntil !== undefined && { openUntil: input.openUntil }),
      })
      .where(eq(lobbies.id, id))
      .returning();

    const row = result[0];
    if (!row) return null;
    return toLobby(row);
  },

  async deleteById(id: string): Promise<void> {
    await db.delete(lobbies).where(eq(lobbies.id, id));
  },

  async countOtherMembers(id: string, hostUserId: string): Promise<number> {
    const result = await db
      .select({ cnt: count() })
      .from(lobbyMembers)
      .where(
        and(
          eq(lobbyMembers.lobbyId, id),
          or(
            isNull(lobbyMembers.userId),
            sql`${lobbyMembers.userId} != ${hostUserId}`,
          ),
        ),
      );
    return result[0]?.cnt ?? 0;
  },

  async executeWithLock(id, fn) {
    // 削除フローの TOCTOU 対策:
    // トランザクション開始直後に対象募集枠行へ `SELECT ... FOR UPDATE` で
    // 排他ロックを取得する。既存 game-session の executeWithLock と同方針。
    return db.transaction(async (tx) => {
      await tx
        .select({ id: lobbies.id })
        .from(lobbies)
        .where(eq(lobbies.id, id))
        .for('update');

      const txRepo = createLobbyRepository(tx as unknown as Database);
      return fn(txRepo);
    });
  },

  async findStatusFields(id: string) {
    const row = await db
      .select({
        isPublished: lobbies.isPublished,
        openUntil: lobbies.openUntil,
        closedAt: lobbies.closedAt,
        cancelledAt: lobbies.cancelledAt,
      })
      .from(lobbies)
      .where(eq(lobbies.id, id))
      .limit(1);

    if (!row[0]) return null;
    const r = row[0];
    return {
      isPublished: r.isPublished,
      openUntil: toDateOrNull(r.openUntil),
      closedAt: r.closedAt,
      cancelledAt: r.cancelledAt,
    };
  },

  async publish(id: string): Promise<Lobby | null> {
    const result = await db
      .update(lobbies)
      .set({ isPublished: true })
      .where(and(eq(lobbies.id, id), eq(lobbies.isPublished, false)))
      .returning();

    const row = result[0];
    if (!row) return null;
    return toLobby(row);
  },

  async cancel(id: string): Promise<Lobby | null> {
    // 確定（closed_at）と中止（cancelled_at）は排他ガードにより共存しない
    // （design-v1.1 意思決定ログ）。application 層のステータスチェックだけでは
    // confirm との並行実行で confirmed + cancelled が共存し得るため、
    // 条件付き UPDATE で DB レベルでも排他を担保する。
    const result = await db
      .update(lobbies)
      .set({ cancelledAt: new Date() })
      .where(
        and(
          eq(lobbies.id, id),
          isNull(lobbies.cancelledAt),
          isNull(lobbies.closedAt),
        ),
      )
      .returning();

    const row = result[0];
    if (!row) return null;
    return toLobby(row);
  },

  async createWithHostAndCandidates(params): Promise<Lobby> {
    return db.transaction(async (tx) => {
      const result = await tx
        .insert(lobbies)
        .values({
          hostUserId: params.hostUserId,
          title: params.title,
          description: params.description ?? null,
          scenarioName: params.scenarioName ?? null,
          location: params.location ?? null,
          maxPlayers: params.maxPlayers ?? null,
          openUntil: params.openUntil ?? null,
          guestLinkToken: params.guestLinkToken,
          isPublished: false,
        })
        .returning();

      const row = result[0];
      if (!row) throw new Error('募集枠の作成に失敗しました');

      await tx.insert(lobbyMembers).values({
        lobbyId: row.id,
        userId: params.hostUserId,
      });

      if (params.candidateDates.length > 0) {
        await tx.insert(lobbyCandidates).values(
          params.candidateDates.map((date) => ({
            lobbyId: row.id,
            date,
          })),
        );
      }

      return toLobby(row);
    });
  },

  async findLobbyVisibility(
    id: string,
  ): Promise<{ isPublished: boolean; hostUserId: string } | null> {
    const row = await db
      .select({
        isPublished: lobbies.isPublished,
        hostUserId: lobbies.hostUserId,
      })
      .from(lobbies)
      .where(eq(lobbies.id, id))
      .limit(1);
    if (!row[0]) return null;
    return { isPublished: row[0].isPublished, hostUserId: row[0].hostUserId };
  },

  async findMembersByLobbyId(lobbyId: string): Promise<LobbyMember[]> {
    const rows = await db
      .select({
        id: lobbyMembers.id,
        userId: lobbyMembers.userId,
        userName: user.name,
        guestName: lobbyMembers.guestName,
        createdAt: lobbyMembers.createdAt,
      })
      .from(lobbyMembers)
      .leftJoin(user, eq(user.id, lobbyMembers.userId))
      .where(eq(lobbyMembers.lobbyId, lobbyId))
      .orderBy(lobbyMembers.createdAt);

    return rows.map((r) => ({
      id: r.id,
      userId: r.userId,
      userName: r.userName ?? null,
      guestName: r.guestName,
      joinedAt: r.createdAt.toISOString(),
    }));
  },

  async findMemberByUserId(
    lobbyId: string,
    userId: string,
  ): Promise<string | null> {
    const row = await db
      .select({ id: lobbyMembers.id })
      .from(lobbyMembers)
      .where(
        and(eq(lobbyMembers.lobbyId, lobbyId), eq(lobbyMembers.userId, userId)),
      )
      .limit(1);
    return row[0]?.id ?? null;
  },

  async addMember(
    lobbyId: string,
    userId: string,
    _input: JoinLobbyInput,
  ): Promise<LobbyMember | null> {
    const result = await db
      .insert(lobbyMembers)
      .values({
        lobbyId,
        userId,
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
      joinedAt: row.createdAt.toISOString(),
    };
  },

  async addGuestMember(
    lobbyId: string,
    input: JoinLobbyAsGuestInput,
  ): Promise<LobbyMember> {
    const result = await db
      .insert(lobbyMembers)
      .values({
        lobbyId,
        userId: null,
        guestName: input.guestName,
      })
      .returning();

    const row = result[0];
    if (!row) throw new Error('ゲストメンバーの追加に失敗しました');

    return {
      id: row.id,
      userId: null,
      userName: null,
      guestName: row.guestName,
      joinedAt: row.createdAt.toISOString(),
    };
  },

  async findMemberOwner(
    memberId: string,
  ): Promise<{ lobbyId: string; userId: string | null } | null> {
    const row = await db
      .select({
        lobbyId: lobbyMembers.lobbyId,
        userId: lobbyMembers.userId,
      })
      .from(lobbyMembers)
      .where(eq(lobbyMembers.id, memberId))
      .limit(1);
    return row[0] ?? null;
  },

  async deleteMemberById(memberId: string): Promise<void> {
    await db.delete(lobbyMembers).where(eq(lobbyMembers.id, memberId));
  },

  async findByLobbyId(lobbyId: string): Promise<LobbyAvailabilityDate[]> {
    const rows = await db
      .select({
        candidateId: lobbyCandidates.id,
        date: lobbyCandidates.date,
        answerId: lobbyAnswers.id,
        memberId: lobbyAnswers.memberId,
        answer: lobbyAnswers.answer,
        comment: lobbyAnswers.comment,
      })
      .from(lobbyCandidates)
      .leftJoin(lobbyAnswers, eq(lobbyAnswers.candidateId, lobbyCandidates.id))
      .where(eq(lobbyCandidates.lobbyId, lobbyId))
      .orderBy(lobbyCandidates.date);

    const map = new Map<string, LobbyAvailabilityDate>();
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
        const answerValue = row.answer as LobbyAvailabilityDateAnswer['answer'];
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

  async addDate(lobbyId: string, date: string): Promise<LobbyAvailabilityDate> {
    const result = await db
      .insert(lobbyCandidates)
      .values({ lobbyId, date })
      .returning();

    const row = result[0];
    if (!row) throw new Error('候補日の追加に失敗しました');
    return { id: row.id, date: row.date, answers: [] };
  },

  async findCandidateOwner(
    dateId: string,
  ): Promise<{ lobbyId: string; date: string } | null> {
    const row = await db
      .select({
        lobbyId: lobbyCandidates.lobbyId,
        date: lobbyCandidates.date,
      })
      .from(lobbyCandidates)
      .where(eq(lobbyCandidates.id, dateId))
      .limit(1);
    return row[0] ?? null;
  },

  async deleteDateById(dateId: string): Promise<void> {
    await db.delete(lobbyCandidates).where(eq(lobbyCandidates.id, dateId));
  },

  async replaceAllDates(
    lobbyId: string,
    dates: string[],
  ): Promise<LobbyAvailabilityDate[]> {
    return db.transaction(async (tx) => {
      await tx
        .delete(lobbyCandidates)
        .where(eq(lobbyCandidates.lobbyId, lobbyId));

      if (dates.length === 0) return [];

      const inserted = await tx
        .insert(lobbyCandidates)
        .values(dates.map((date) => ({ lobbyId, date })))
        .returning();

      return inserted.map((row) => ({
        id: row.id,
        date: row.date,
        answers: [],
      }));
    });
  },

  async findGuestLinkInfo(
    id: string,
  ): Promise<{ hostUserId: string; token: string } | null> {
    const row = await db
      .select({
        hostUserId: lobbies.hostUserId,
        guestLinkToken: lobbies.guestLinkToken,
      })
      .from(lobbies)
      .where(eq(lobbies.id, id))
      .limit(1);
    if (!row[0]) return null;
    return { hostUserId: row[0].hostUserId, token: row[0].guestLinkToken };
  },

  async findGuestLinkToken(id: string): Promise<string | null> {
    const row = await db
      .select({ guestLinkToken: lobbies.guestLinkToken })
      .from(lobbies)
      .where(eq(lobbies.id, id))
      .limit(1);
    return row[0]?.guestLinkToken ?? null;
  },

  async isGuestMember(lobbyId: string, memberId: string): Promise<boolean> {
    const row = await db
      .select({ userId: lobbyMembers.userId })
      .from(lobbyMembers)
      .where(
        and(
          eq(lobbyMembers.id, memberId),
          eq(lobbyMembers.lobbyId, lobbyId),
          isNull(lobbyMembers.userId),
        ),
      )
      .limit(1);
    return row[0] !== undefined;
  },

  async upsertAnswer(
    candidateId: string,
    memberId: string,
    input: UpdateLobbyAvailabilityDateResponseInput,
  ): Promise<LobbyAvailabilityDateAnswer> {
    const result = await db
      .insert(lobbyAnswers)
      .values({
        candidateId,
        memberId,
        answer: input.answer,
        comment: input.comment ?? null,
      })
      .onConflictDoUpdate({
        target: [lobbyAnswers.candidateId, lobbyAnswers.memberId],
        set: {
          answer: input.answer,
          comment: input.comment ?? null,
        },
      })
      .returning();

    const row = result[0];
    if (!row) throw new Error('回答の登録に失敗しました');

    const answerValue = row.answer as LobbyAvailabilityDateAnswer['answer'];
    return {
      id: row.id,
      memberId: row.memberId,
      answer: answerValue,
      comment: row.comment,
    };
  },
});
