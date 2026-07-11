import { and, count, eq, exists, isNull, or, sql, getTableColumns } from 'drizzle-orm';
import type {
  Lobby,
  LobbyDetail,
  LobbyListItem,
  LobbyMember,
  UpdateLobbyInput,
} from '@taku-biyori/shared';
import { LobbyStatus } from '@taku-biyori/shared';
import type { Database } from '@/system/infrastructure/database/client';
import {
  lobbies,
  lobbyMembers,
  lobbyCandidates,
} from '@/system/infrastructure/database/lobby-schema';
import { user } from '@/system/infrastructure/database/schema';
import { getLobbyStatus } from '@/lobby/domain/lobby-status';
import type { ListLobbiesRepository } from '@/lobby/application/list-lobbies';
import type { CreateLobbyRepository } from '@/lobby/application/create-lobby';
import type { GetLobbyRepository } from '@/lobby/application/get-lobby';
import type { UpdateLobbyRepository } from '@/lobby/application/update-lobby';
import type { DeleteLobbyRepository } from '@/lobby/application/delete-lobby';
import type { UpdateLobbyStatusRepository } from '@/lobby/application/update-lobby-status';

export type LobbyRepository = ListLobbiesRepository &
  CreateLobbyRepository &
  GetLobbyRepository &
  UpdateLobbyRepository &
  DeleteLobbyRepository &
  UpdateLobbyStatusRepository;

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

const toDateOrNull = (s: string | null): Date | null => (s ? new Date(s) : null);

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
    const result = await db
      .update(lobbies)
      .set({ cancelledAt: new Date() })
      .where(and(eq(lobbies.id, id), isNull(lobbies.cancelledAt)))
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
});
