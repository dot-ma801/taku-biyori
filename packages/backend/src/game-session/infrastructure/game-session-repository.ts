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
  GameSession,
  GameSessionDetail,
  GameSessionListItem,
  GameSessionMember,
  JoinAsGuestInput,
  JoinGameSessionInput,
  UpdateGameSessionInput,
  UpdateMemberInput,
} from '@taku-biyori/shared';
import { GameSessionStatus } from '@taku-biyori/shared';
import type { Database } from '@/system/infrastructure/database/client';
import {
  gameSessions,
  gameSessionMembers,
} from '@/system/infrastructure/database/game-session-schema';
import { user } from '@/system/infrastructure/database/schema';
import { getGameSessionStatus } from '@/game-session/domain/game-session-status';
import type { ListGameSessionsRepository } from '@/game-session/application/list-game-sessions';
import type { CreateGameSessionRepository } from '@/game-session/application/create-game-session';
import type { GetGameSessionRepository } from '@/game-session/application/get-game-session';
import type { UpdateGameSessionRepository } from '@/game-session/application/update-game-session';
import type { DeleteGameSessionRepository } from '@/game-session/application/delete-game-session';
import type { UpdateGameSessionStatusRepository } from '@/game-session/application/update-game-session-status';
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
  ListMembersRepository &
  JoinGameSessionRepository &
  JoinAsGuestRepository &
  UpdateMemberRepository &
  LeaveGameSessionRepository &
  GetGuestLinkRepository &
  GetGuestLinkPreviewRepository;

export type GameSessionRow = {
  id: string;
  hostUserId: string;
  title: string;
  scenarioName: string | null;
  description: string | null;
  location: string | null;
  maxPlayers: number | null;
  isPublished: boolean;
  scheduledAt: string | null;
  completedAt: Date | null;
  cancelledAt: Date | null;
  lobbyId: string | null;
  createdAt: Date;
  updatedAt: Date;
};

type ListRow = GameSessionRow & {
  memberCount: number;
  userMemberId: string | null;
};

const toDateOrNull = (s: string | null): Date | null =>
  s ? new Date(s) : null;

export const toGameSession = (row: GameSessionRow): GameSession => ({
  id: row.id,
  title: row.title,
  description: row.description,
  scenarioName: row.scenarioName,
  location: row.location,
  status: getGameSessionStatus({
    isPublished: row.isPublished,
    scheduledAt: toDateOrNull(row.scheduledAt),
    completedAt: row.completedAt,
    cancelledAt: row.cancelledAt,
  }),
  isPublished: row.isPublished,
  scheduledAt: row.scheduledAt,
  completedAt: row.completedAt?.toISOString() ?? null,
  cancelledAt: row.cancelledAt?.toISOString() ?? null,
  lobbyId: row.lobbyId,
  maxMembers: row.maxPlayers,
  createdBy: row.hostUserId,
  createdAt: row.createdAt.toISOString(),
  updatedAt: row.updatedAt.toISOString(),
});

const toListItem = (row: ListRow, userId: string): GameSessionListItem => ({
  id: row.id,
  title: row.title,
  scenarioName: row.scenarioName,
  status: getGameSessionStatus({
    isPublished: row.isPublished,
    scheduledAt: toDateOrNull(row.scheduledAt),
    completedAt: row.completedAt,
    cancelledAt: row.cancelledAt,
  }),
  isPublished: row.isPublished,
  memberCount: row.memberCount,
  maxMembers: row.maxPlayers,
  scheduledAt: row.scheduledAt,
  createdAt: row.createdAt.toISOString(),
  updatedAt: row.updatedAt.toISOString(),
  role:
    row.hostUserId === userId
      ? 'host'
      : row.userMemberId !== null
        ? 'member'
        : null,
});

export const createGameSessionRepository = (
  db: Database,
): GameSessionRepository => ({
  async findByUserId(userId: string): Promise<GameSessionListItem[]> {
    const rows = await db
      .select({
        ...getTableColumns(gameSessions),
        memberCount: count(gameSessionMembers.id),
        userMemberId: sql<string | null>`(
          SELECT id FROM game_session.game_session_members
          WHERE game_session_id = ${gameSessions.id}
            AND user_id = ${userId}
          LIMIT 1
        )`,
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
          // 公開済みの卓は誰でも閲覧できる（design-v1.1 §8 の認可モデル）
          eq(gameSessions.isPublished, true),
        ),
      )
      .groupBy(gameSessions.id);

    return rows.map((row) =>
      toListItem({ ...row, memberCount: Number(row.memberCount) }, userId),
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
        memberLobbyMemberId: gameSessionMembers.lobbyMemberId,
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
        lobbyMemberId: r.memberLobbyMemberId,
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

  async countOtherMembers(id: string, hostUserId: string): Promise<number> {
    const result = await db
      .select({ cnt: count() })
      .from(gameSessionMembers)
      .where(
        and(
          eq(gameSessionMembers.gameSessionId, id),
          or(
            isNull(gameSessionMembers.userId),
            sql`${gameSessionMembers.userId} != ${hostUserId}`,
          ),
        ),
      );
    return result[0]?.cnt ?? 0;
  },

  async executeWithLock(id, fn) {
    // 削除フローの TOCTOU 対策:
    // トランザクション開始直後に対象セッション行へ `SELECT ... FOR UPDATE` で
    // 排他ロックを取得する。これにより同一セッションへの並行 publish/complete/join 等は
    // このトランザクション終了までブロックされ、コールバック内の検証クエリと
    // 最終 DELETE は同じスナップショットから決定できる。
    return db.transaction(async (tx) => {
      await tx
        .select({ id: gameSessions.id })
        .from(gameSessions)
        .where(eq(gameSessions.id, id))
        .for('update');

      // Drizzle の tx は `PgTransaction`、Database は `PostgresJsDatabase` で兄弟型のため
      // 直接代入できないが、本ファクトリで利用する select/insert/update/delete はどちらも
      // `PgDatabase` から継承した同一インターフェースで、ランタイム挙動も同じ。
      // 構造的にしか型が一致しないため unknown 経由でキャストする。
      const txRepo = createGameSessionRepository(tx as unknown as Database);
      return fn(txRepo);
    });
  },

  async findStatusFields(id: string) {
    const row = await db
      .select({
        isPublished: gameSessions.isPublished,
        scheduledAt: gameSessions.scheduledAt,
        completedAt: gameSessions.completedAt,
        cancelledAt: gameSessions.cancelledAt,
      })
      .from(gameSessions)
      .where(eq(gameSessions.id, id))
      .limit(1);

    if (!row[0]) return null;
    const r = row[0];
    return {
      isPublished: r.isPublished,
      scheduledAt: toDateOrNull(r.scheduledAt),
      completedAt: r.completedAt,
      cancelledAt: r.cancelledAt,
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
    // completed_at が NULL の行だけを更新する（二重完了の排他）。
    // cancelled_at も NULL であることを要求し、cancel() との並行実行で
    // 両方の終端カラムが同時にセットされる二重終端状態を防ぐ。
    const result = await db
      .update(gameSessions)
      .set({ completedAt })
      .where(
        and(
          eq(gameSessions.id, id),
          eq(gameSessions.isPublished, true),
          isNull(gameSessions.completedAt),
          isNull(gameSessions.cancelledAt),
        ),
      )
      .returning();

    const session = result[0];
    if (!session) return null;
    return toGameSession(session);
  },

  async cancel(id: string, cancelledAt: Date): Promise<GameSession | null> {
    // cancelled_at が NULL の行だけを更新する（二重中止・並行中止の排他）。
    // completed_at も NULL であることを要求し、complete() との並行実行で
    // 両方の終端カラムが同時にセットされる二重終端状態を防ぐ。
    // isPublished も complete() と同様に要求し、draft 卓がリポジトリ単体呼び出しで
    // 中止されてしまわないようにする（application 層のステータスチェックと対称に保つ）。
    const result = await db
      .update(gameSessions)
      .set({ cancelledAt })
      .where(
        and(
          eq(gameSessions.id, id),
          eq(gameSessions.isPublished, true),
          isNull(gameSessions.cancelledAt),
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
        lobbyMemberId: gameSessionMembers.lobbyMemberId,
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
      lobbyMemberId: r.lobbyMemberId,
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
      lobbyMemberId: row.lobbyMemberId,
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
        characterName: null,
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
      lobbyMemberId: row.lobbyMemberId,
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
      lobbyMemberId: row.lobbyMemberId,
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

  async findByGuestLinkToken(token: string): Promise<GameSession | null> {
    const row = await db
      .select()
      .from(gameSessions)
      .where(eq(gameSessions.guestLinkToken, token))
      .limit(1);
    if (!row[0]) return null;
    return toGameSession(row[0]);
  },
});
