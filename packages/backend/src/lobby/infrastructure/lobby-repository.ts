import {
  and,
  count,
  eq,
  exists,
  inArray,
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
  LobbyMemberLinkRequest,
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
  lobbyMemberLinkRequests,
} from '@/system/infrastructure/database/lobby-schema';
import { gameSessionMembers } from '@/system/infrastructure/database/game-session-schema';
import { isUniqueViolation } from '@/system/infrastructure/database/errors';
import { user } from '@/system/infrastructure/database/schema';
import { getLobbyStatus } from '@/lobby/domain/lobby-status';
import type { CandidateDateDiff } from '@/lobby/domain/candidate-date-diff';
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
import type { ConfirmLobbyRepository } from '@/lobby/application/confirm-lobby';
import type { RequestMemberLinkRepository } from '@/lobby/application/request-member-link';
import type { ListMemberLinkRequestsRepository } from '@/lobby/application/list-member-link-requests';
import type {
  ApproveMemberLinkRepository,
  LinkRequestOwner,
} from '@/lobby/application/approve-member-link';
import type { DeleteMemberLinkRequestRepository } from '@/lobby/application/delete-member-link-request';
import { insertGameSessionWithMembers } from '@/game-session/infrastructure/insert-game-session-with-members';
import { findConfirmedGameSessionByLobbyId } from '@/game-session/infrastructure/find-confirmed-game-session-by-lobby-id';

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
  UpdateGuestAvailabilityDateResponseRepository &
  ConfirmLobbyRepository &
  RequestMemberLinkRepository &
  ListMemberLinkRequestsRepository &
  ApproveMemberLinkRepository &
  DeleteMemberLinkRequestRepository;

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

/**
 * 申請IDの配列から、ホストの承認画面に必要な情報（ゲスト表示名・申請者名）を
 * 揃えて取得します。リポジトリのインターフェースには含めないため関数として切り出します。
 */
const findLinkRequestsByIds = async (
  db: Database,
  requestIds: string[],
): Promise<LobbyMemberLinkRequest[]> => {
  if (requestIds.length === 0) return [];

  const rows = await db
    .select({
      id: lobbyMemberLinkRequests.id,
      memberId: lobbyMemberLinkRequests.memberId,
      memberGuestName: lobbyMembers.guestName,
      requestedUserId: lobbyMemberLinkRequests.requestedUserId,
      requestedUserName: user.name,
      createdAt: lobbyMemberLinkRequests.createdAt,
    })
    .from(lobbyMemberLinkRequests)
    .innerJoin(
      lobbyMembers,
      eq(lobbyMembers.id, lobbyMemberLinkRequests.memberId),
    )
    .leftJoin(user, eq(user.id, lobbyMemberLinkRequests.requestedUserId))
    .where(inArray(lobbyMemberLinkRequests.id, requestIds))
    .orderBy(lobbyMemberLinkRequests.createdAt);

  return rows.map((r) => ({
    id: r.id,
    memberId: r.memberId,
    memberGuestName: r.memberGuestName,
    requestedUserId: r.requestedUserId,
    requestedUserName: r.requestedUserName ?? null,
    createdAt: r.createdAt.toISOString(),
  }));
};

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
          and(
            eq(lobbies.isPublished, true),
            or(
              isNull(lobbies.openUntil),
              sql`${lobbies.openUntil} > CURRENT_DATE`,
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

    if (first.closedAt === null) {
      return { ...lobby, members };
    }

    // 確定済みの場合、作成された卓と選出メンバーの lobbyMemberId を取得する
    // （卓のテーブルには触れず、卓機能側の関数に委譲する）
    const confirmedGameSession = await findConfirmedGameSessionByLobbyId(
      db,
      id,
    );

    return { ...lobby, members, confirmedGameSession };
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
          params.candidateDates.map((entry) => ({
            lobbyId: row.id,
            date: entry.date,
            dateNote: entry.dateNote,
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

  async insertLinkRequest(
    memberId: string,
    userId: string,
  ): Promise<LobbyMemberLinkRequest | null> {
    const result = await db
      .insert(lobbyMemberLinkRequests)
      .values({ memberId, requestedUserId: userId })
      .onConflictDoNothing()
      .returning({ id: lobbyMemberLinkRequests.id });

    // onConflictDoNothing で競合した場合は空配列が返る（重複申請）
    const inserted = result[0];
    if (!inserted) return null;

    const rows = await findLinkRequestsByIds(db, [inserted.id]);
    const row = rows[0];
    if (!row) throw new Error('紐づけ申請の登録に失敗しました');
    return row;
  },

  async findLinkRequestsByLobbyId(
    lobbyId: string,
  ): Promise<LobbyMemberLinkRequest[]> {
    const rows = await db
      .select({ id: lobbyMemberLinkRequests.id })
      .from(lobbyMemberLinkRequests)
      .innerJoin(
        lobbyMembers,
        eq(lobbyMembers.id, lobbyMemberLinkRequests.memberId),
      )
      .where(eq(lobbyMembers.lobbyId, lobbyId));

    return findLinkRequestsByIds(
      db,
      rows.map((r) => r.id),
    );
  },

  async findLinkRequest(requestId: string): Promise<LinkRequestOwner | null> {
    const row = await db
      .select({
        lobbyId: lobbyMembers.lobbyId,
        memberId: lobbyMemberLinkRequests.memberId,
        requestedUserId: lobbyMemberLinkRequests.requestedUserId,
      })
      .from(lobbyMemberLinkRequests)
      .innerJoin(
        lobbyMembers,
        eq(lobbyMembers.id, lobbyMemberLinkRequests.memberId),
      )
      .where(eq(lobbyMemberLinkRequests.id, requestId))
      .limit(1);

    return row[0] ?? null;
  },

  async deleteLinkRequest(requestId: string): Promise<void> {
    await db
      .delete(lobbyMemberLinkRequests)
      .where(eq(lobbyMemberLinkRequests.id, requestId));
  },

  async applyMemberLink(
    memberId: string,
    userId: string,
  ): Promise<LobbyMember | null> {
    try {
      return await db.transaction(async (tx) => {
        // user_id IS NULL を条件に含めることで、既に紐づけ済みの行を
        // 二重承認で上書きしない（0 件更新 → 紐づけ済みとして conflict 扱い）
        const updated = await tx
          .update(lobbyMembers)
          .set({ userId })
          .where(
            and(eq(lobbyMembers.id, memberId), isNull(lobbyMembers.userId)),
          )
          .returning();

        const row = updated[0];
        if (!row) return null;

        // 確定済みの卓にコピーされたメンバーも同時に紐づける。
        // ここが一意制約に衝突した場合はトランザクション全体を巻き戻す（ADR 0008）
        await tx
          .update(gameSessionMembers)
          .set({ userId })
          .where(
            and(
              eq(gameSessionMembers.lobbyMemberId, memberId),
              isNull(gameSessionMembers.userId),
            ),
          );

        // 承認済みメンバー宛の申請は他ユーザーのものも含めて用済みになる
        await tx
          .delete(lobbyMemberLinkRequests)
          .where(eq(lobbyMemberLinkRequests.memberId, memberId));

        const userRow = await tx
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
      });
    } catch (error) {
      // 申請から承認までの間に同じユーザーがログイン参加した場合に起きる
      if (isUniqueViolation(error)) return null;
      throw error;
    }
  },

  async findByLobbyId(lobbyId: string): Promise<LobbyAvailabilityDate[]> {
    const rows = await db
      .select({
        candidateId: lobbyCandidates.id,
        date: lobbyCandidates.date,
        dateNote: lobbyCandidates.dateNote,
        answerId: lobbyAnswers.id,
        memberId: lobbyAnswers.memberId,
        answer: lobbyAnswers.answer,
        comment: lobbyAnswers.comment,
      })
      .from(lobbyCandidates)
      .leftJoin(lobbyAnswers, eq(lobbyAnswers.candidateId, lobbyCandidates.id))
      .where(eq(lobbyCandidates.lobbyId, lobbyId))
      .orderBy(lobbyCandidates.date, lobbyAnswers.createdAt);

    const map = new Map<string, LobbyAvailabilityDate>();
    for (const row of rows) {
      if (!map.has(row.candidateId)) {
        map.set(row.candidateId, {
          id: row.candidateId,
          date: row.date,
          dateNote: row.dateNote,
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

  async addDate(
    lobbyId: string,
    date: string,
    dateNote: string | null,
  ): Promise<LobbyAvailabilityDate> {
    const result = await db
      .insert(lobbyCandidates)
      .values({ lobbyId, date, dateNote })
      .returning();

    const row = result[0];
    if (!row) throw new Error('候補日の追加に失敗しました');
    return {
      id: row.id,
      date: row.date,
      dateNote: row.dateNote,
      answers: [],
    };
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

  async applyDateChanges(
    lobbyId: string,
    diff: CandidateDateDiff,
  ): Promise<void> {
    // 残る候補日の行は触らない（DELETE→INSERT の全置換にすると行 ID が変わり、
    // lobby_answers が onDelete: cascade で消えてしまう）
    await db.transaction(async (tx) => {
      if (diff.dateIdsToRemove.length > 0) {
        await tx
          .delete(lobbyCandidates)
          .where(
            and(
              eq(lobbyCandidates.lobbyId, lobbyId),
              inArray(lobbyCandidates.id, diff.dateIdsToRemove),
            ),
          );
      }

      if (diff.datesToAdd.length > 0) {
        await tx.insert(lobbyCandidates).values(
          diff.datesToAdd.map((entry) => ({
            lobbyId,
            date: entry.date,
            dateNote: entry.dateNote,
          })),
        );
      }

      // 残る候補日のひとことだけを更新する。行を作り直さないので回答は保持される
      for (const note of diff.notesToUpdate) {
        await tx
          .update(lobbyCandidates)
          .set({ dateNote: note.dateNote })
          .where(
            and(
              eq(lobbyCandidates.lobbyId, lobbyId),
              eq(lobbyCandidates.id, note.id),
            ),
          );
      }
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

  async findLobbyCore(id: string) {
    const row = await db
      .select({
        hostUserId: lobbies.hostUserId,
        title: lobbies.title,
        scenarioName: lobbies.scenarioName,
        description: lobbies.description,
        location: lobbies.location,
        maxPlayers: lobbies.maxPlayers,
      })
      .from(lobbies)
      .where(eq(lobbies.id, id))
      .limit(1);
    return row[0] ?? null;
  },

  async findMemberCoresByIds(lobbyId: string, memberIds: string[]) {
    if (memberIds.length === 0) return [];

    // FOR KEY SHARE で選出メンバー行をロックする。
    // executeWithLock のロビー行ロックだけでは lobby_members はロックされず、
    // このメソッドの読み取り〜卓確定（game_session_members INSERT）の間に
    // leave-lobby 等による選出メンバーの DELETE がコミットされると
    // FK 違反（23503）で確定処理が失敗しうる。
    // FOR KEY SHARE を取ることで、同じ行を消そうとする DELETE をこのトランザクションの
    // コミットまでブロックし、確定処理と退出の競合を防ぐ。
    const rows = await db
      .select({
        id: lobbyMembers.id,
        userId: lobbyMembers.userId,
        guestName: lobbyMembers.guestName,
      })
      .from(lobbyMembers)
      .where(
        and(
          eq(lobbyMembers.lobbyId, lobbyId),
          inArray(lobbyMembers.id, memberIds),
        ),
      )
      .for('key share');

    return rows;
  },

  async closeLobby(id: string, closedAt: Date): Promise<boolean> {
    // closed_at・cancelled_at の両方が NULL の行だけを更新する
    // （二重確定・確定と中止の並行実行を排他する。design-v1.1 §5・意思決定ログ）
    const result = await db
      .update(lobbies)
      .set({ closedAt })
      .where(
        and(
          eq(lobbies.id, id),
          isNull(lobbies.closedAt),
          isNull(lobbies.cancelledAt),
        ),
      )
      .returning();

    return result.length > 0;
  },

  // 卓の生成は卓機能側の責務なので、テーブル定義や行の変換には触れず委譲する
  async createGameSessionFromLobby(params) {
    return insertGameSessionWithMembers(db, params);
  },
});
