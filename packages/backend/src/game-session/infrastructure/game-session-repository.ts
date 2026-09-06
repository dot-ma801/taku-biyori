import {
  and,
  asc,
  count,
  eq,
  inArray,
  isNotNull,
  isNull,
  sql,
} from 'drizzle-orm';
import type {
  GameSession,
  LobbyStatus,
  GameSessionDetail,
  GameSessionListItem,
  GameSessionPlayMemo,
  GameSessionStatusFacts,
  LobbySummary,
  Seat,
  SeatRef,
  SharedGameSessionPlayMemo,
  UpdateGameSessionInput,
} from '@taku-biyori/shared';
import {
  getGameSessionStatus,
  getLobbyStatus,
  resolveGameSessionDisplay,
} from '@taku-biyori/shared';
import type { Database } from '@/system/infrastructure/database/client';
import {
  gameSessions,
  playMemos,
  characterAssignments,
  seats,
} from '@/system/infrastructure/database/game-session-schema';
import {
  lobbies,
  lobbyEntries,
} from '@/system/infrastructure/database/lobby-schema';
import { user } from '@/system/infrastructure/database/schema';

// ---------- 行の形とレスポンスへの変換 ----------

export type GameSessionRow = {
  id: string;
  lobbyId: string;
  scheduledAt: string;
  title: string | null;
  scenarioName: string | null;
  description: string | null;
  location: string | null;
  timeLabel: string | null;
  completedAt: Date | null;
  cancelledAt: Date | null;
  createdAt: Date;
  updatedAt: Date;
};

export type LobbyRow = {
  id: string;
  title: string;
  scenarioName: string | null;
  location: string | null;
  maxPlayers: number | null;
  hostUserId: string;
  publishedAt: Date | null;
  openUntil: string | null;
  receptionClosedAt: Date | null;
  disbandedAt: Date | null;
};

const gameSessionColumns = {
  id: gameSessions.id,
  lobbyId: gameSessions.lobbyId,
  scheduledAt: gameSessions.scheduledAt,
  title: gameSessions.title,
  scenarioName: gameSessions.scenarioName,
  description: gameSessions.description,
  location: gameSessions.location,
  timeLabel: gameSessions.timeLabel,
  completedAt: gameSessions.completedAt,
  cancelledAt: gameSessions.cancelledAt,
  createdAt: gameSessions.createdAt,
  updatedAt: gameSessions.updatedAt,
};

const lobbyColumns = {
  lobbyId2: lobbies.id,
  lobbyTitle: lobbies.title,
  lobbyScenarioName: lobbies.scenarioName,
  lobbyLocation: lobbies.location,
  lobbyMaxPlayers: lobbies.maxPlayers,
  lobbyHostUserId: lobbies.hostUserId,
  lobbyPublishedAt: lobbies.publishedAt,
  lobbyOpenUntil: lobbies.openUntil,
  lobbyReceptionClosedAt: lobbies.receptionClosedAt,
  lobbyDisbandedAt: lobbies.disbandedAt,
};

type LobbyJoinRow = {
  lobbyId2: string;
  lobbyTitle: string;
  lobbyScenarioName: string | null;
  lobbyLocation: string | null;
  lobbyMaxPlayers: number | null;
  lobbyHostUserId: string;
  lobbyPublishedAt: Date | null;
  lobbyOpenUntil: string | null;
  lobbyReceptionClosedAt: Date | null;
  lobbyDisbandedAt: Date | null;
};

const toLobbyRow = (row: LobbyJoinRow): LobbyRow => ({
  id: row.lobbyId2,
  title: row.lobbyTitle,
  scenarioName: row.lobbyScenarioName,
  location: row.lobbyLocation,
  maxPlayers: row.lobbyMaxPlayers,
  hostUserId: row.lobbyHostUserId,
  publishedAt: row.lobbyPublishedAt,
  openUntil: row.lobbyOpenUntil,
  receptionClosedAt: row.lobbyReceptionClosedAt,
  disbandedAt: row.lobbyDisbandedAt,
});

const toStatusFacts = (row: {
  scheduledAt: string;
  completedAt: Date | null;
  cancelledAt: Date | null;
}): GameSessionStatusFacts => ({
  scheduledAt: row.scheduledAt,
  completedAt: row.completedAt,
  cancelledAt: row.cancelledAt,
});

export const toLobbySummary = (row: LobbyRow): LobbySummary => ({
  id: row.id,
  title: row.title,
  scenarioName: row.scenarioName,
  location: row.location,
  maxPlayers: row.maxPlayers,
  hostUserId: row.hostUserId,
  status: getLobbyStatus({
    publishedAt: row.publishedAt,
    openUntil: row.openUntil,
    receptionClosedAt: row.receptionClosedAt,
    disbandedAt: row.disbandedAt,
  }),
});

const toOverrides = (row: GameSessionRow) => ({
  title: row.title,
  scenarioName: row.scenarioName,
  location: row.location,
  timeLabel: row.timeLabel,
});

/**
 * セッション行をレスポンス表現へ変換する。
 *
 * **解決済みの表示値は持たせない。** 上書きの生値（overrides）とロビーの既定値（lobby）を
 * 両方返し、解決はクライアントが行う（design-v2 §5-5）。
 */
export const toGameSession = (
  row: GameSessionRow,
  lobby: LobbyRow,
): GameSession => ({
  id: row.id,
  lobbyId: row.lobbyId,
  scheduledAt: row.scheduledAt,
  status: getGameSessionStatus(toStatusFacts(row)),
  description: row.description,
  overrides: toOverrides(row),
  lobby: toLobbySummary(lobby),
  completedAt: row.completedAt?.toISOString() ?? null,
  cancelledAt: row.cancelledAt?.toISOString() ?? null,
  createdAt: row.createdAt.toISOString(),
  updatedAt: row.updatedAt.toISOString(),
});

/**
 * 一覧の要素へ変換する。
 *
 * 一覧はロビーが自明な文脈で使われるため、要素ごとに lobby を繰り返さず
 * **解決済みの表示値**を持たせる（design-v2 §5-5）。
 */
export const toListItem = (
  row: GameSessionRow,
  lobby: LobbyRow,
  seatRefs: SeatRef[],
): GameSessionListItem => {
  const display = resolveGameSessionDisplay(
    { overrides: toOverrides(row) },
    {
      title: lobby.title,
      scenarioName: lobby.scenarioName,
      location: lobby.location,
    },
  );
  return {
    id: row.id,
    lobbyId: row.lobbyId,
    title: display.title,
    scenarioName: display.scenarioName,
    status: getGameSessionStatus(toStatusFacts(row)),
    scheduledAt: row.scheduledAt,
    timeLabel: display.timeLabel,
    seats: seatRefs,
    hostUserId: lobby.hostUserId,
    createdAt: row.createdAt.toISOString(),
    updatedAt: row.updatedAt.toISOString(),
  };
};

type PlayMemoRow = {
  seatId: string;
  body: string;
  sharedAt: Date | null;
  updatedAt: Date;
};

// memberId というキー名は shared の契約（GameSessionPlayMemo）のまま据え置く。
// 中身は seats.id で、seatId への改名はタスク6（#116）で行う（design-v2 §6-15）
const toPlayMemo = (row: PlayMemoRow): GameSessionPlayMemo => ({
  seatId: row.seatId,
  body: row.body,
  sharedAt: row.sharedAt?.toISOString() ?? null,
  updatedAt: row.updatedAt.toISOString(),
});

// ---------- 着席 ----------

const seatSelection = {
  id: seats.id,
  entryId: seats.lobbyEntryId,
  userId: lobbyEntries.userId,
  userName: user.name,
  guestName: lobbyEntries.guestName,
  characterName: characterAssignments.characterName,
  createdAt: seats.createdAt,
};

type SeatSelectionRow = {
  id: string;
  entryId: string;
  userId: string | null;
  userName: string | null;
  guestName: string | null;
  characterName: string | null;
  createdAt: Date;
};

// 表示名は LobbyEntry と user を JOIN して解決する。
// seats テーブル自体は2つの FK だけの純粋な選出ファクト（design-v2 §3-8）
const toSeat = (row: SeatSelectionRow): Seat => ({
  id: row.id,
  entryId: row.entryId,
  userId: row.userId,
  userName: row.userName ?? null,
  guestName: row.guestName,
  characterName: row.characterName,
  seatedAt: row.createdAt.toISOString(),
});

/**
 * セッション機能のリポジトリ。
 *
 * 各ユースケースは自分が使うメソッドだけを宣言した狭いインターフェースを持ち、
 * この型はその実装側の全体像を表す。ロック用のコールバックが自分自身を受け取るため
 * 戻り値型の推論が循環する。明示的に宣言してそれを断ち切っている。
 */
export interface GameSessionRepository {
  findByUserId(userId: string): Promise<GameSessionListItem[]>;
  findByLobbyId(lobbyId: string): Promise<GameSessionListItem[]>;
  findDetailById(id: string): Promise<GameSessionDetail | null>;
  findHostUserId(id: string): Promise<string | null>;
  findLobbyId(id: string): Promise<string | null>;
  findStatusFields(id: string): Promise<GameSessionStatusFacts | null>;
  gameSessionExists(id: string): Promise<boolean>;
  findLobbyForViewing(
    lobbyId: string,
  ): Promise<{ hostUserId: string; publishedAt: Date | null } | null>;
  findLobbyForHost(
    lobbyId: string,
  ): Promise<{ hostUserId: string; status: LobbyStatus } | null>;

  createGameSession(params: {
    lobbyId: string;
    scheduledAt: string;
    entryIds: string[];
    title?: string | null;
    scenarioName?: string | null;
    description?: string | null;
    location?: string | null;
    timeLabel?: string | null;
  }): Promise<GameSession>;
  findActiveEntryIds(lobbyId: string, entryIds: string[]): Promise<string[]>;
  updateById(
    id: string,
    input: UpdateGameSessionInput,
  ): Promise<GameSession | null>;
  deleteById(id: string): Promise<void>;
  complete(id: string, completedAt: Date): Promise<GameSession | null>;
  cancel(id: string, cancelledAt: Date): Promise<GameSession | null>;
  countOtherSeats(id: string, hostUserId: string): Promise<number>;
  executeWithLock<T>(
    id: string,
    fn: (lockedRepo: GameSessionRepository) => Promise<T>,
  ): Promise<T>;
  executeWithLobbyLock<T>(
    lobbyId: string,
    entryIds: string[],
    fn: (lockedRepo: GameSessionRepository) => Promise<T>,
  ): Promise<T>;

  findSeatsByGameSessionId(gameSessionId: string): Promise<Seat[]>;
  findSeatById(seatId: string): Promise<Seat | null>;
  findSeatOwner(
    seatId: string,
  ): Promise<{ gameSessionId: string; userId: string | null } | null>;
  findSeatByUserId(
    gameSessionId: string,
    userId: string,
  ): Promise<string | null>;
  addSeat(gameSessionId: string, lobbyEntryId: string): Promise<Seat | null>;
  findEntryLobbyId(entryId: string): Promise<string | null>;
  updateSeatCharacterName(
    seatId: string,
    characterName: string | null,
  ): Promise<Seat | null>;
  deleteSeatById(seatId: string): Promise<void>;

  findPlayMemoBySeatId(seatId: string): Promise<GameSessionPlayMemo | null>;
  upsertPlayMemo(seatId: string, body: string): Promise<GameSessionPlayMemo>;
  updatePlayMemoVisibility(
    seatId: string,
    sharedAt: Date | null,
  ): Promise<GameSessionPlayMemo | null>;
  findSharedPlayMemos(
    gameSessionId: string,
  ): Promise<SharedGameSessionPlayMemo[]>;
}

export const createGameSessionRepository = (
  db: Database,
): GameSessionRepository => {
  /** セッションと所属ロビーを1行で引く。URL の lobbyId 検証にも使う */
  const selectSessionWithLobby = (id: string) =>
    db
      .select({ ...gameSessionColumns, ...lobbyColumns })
      .from(gameSessions)
      .innerJoin(lobbies, eq(lobbies.id, gameSessions.lobbyId))
      .where(eq(gameSessions.id, id))
      .limit(1);

  /** セッション ID ごとの着席参照。一覧は「人数」と「自分がいるか」しか要らない（§6-11） */
  const loadSeatRefs = async (
    gameSessionIds: string[],
  ): Promise<Map<string, SeatRef[]>> => {
    const byId = new Map<string, SeatRef[]>();
    if (gameSessionIds.length === 0) return byId;

    const rows = await db
      .select({
        gameSessionId: seats.gameSessionId,
        id: seats.id,
        userId: lobbyEntries.userId,
      })
      .from(seats)
      .innerJoin(lobbyEntries, eq(lobbyEntries.id, seats.lobbyEntryId))
      .where(inArray(seats.gameSessionId, gameSessionIds))
      .orderBy(asc(seats.createdAt), asc(seats.id));

    for (const row of rows) {
      const list = byId.get(row.gameSessionId) ?? [];
      list.push({ id: row.id, userId: row.userId });
      byId.set(row.gameSessionId, list);
    }
    return byId;
  };

  /** ロビーのホスト・公開ファクト・導出ステータス。閲覧と操作の可否判定に使う */
  const loadLobby = async (
    lobbyId: string,
  ): Promise<{
    hostUserId: string;
    publishedAt: Date | null;
    status: LobbyStatus;
  } | null> => {
    const rows = await db
      .select({
        hostUserId: lobbies.hostUserId,
        publishedAt: lobbies.publishedAt,
        openUntil: lobbies.openUntil,
        receptionClosedAt: lobbies.receptionClosedAt,
        disbandedAt: lobbies.disbandedAt,
      })
      .from(lobbies)
      .where(eq(lobbies.id, lobbyId))
      .limit(1);

    const row = rows[0];
    if (!row) return null;
    return {
      hostUserId: row.hostUserId,
      // 閲覧可否は導出ステータスではなく publishedAt ファクトで判定する。
      // 一度も公開せずに解散したロビーは status が disbanded になり、
      // `status === draft` の判定をすり抜けてしまう（design-v2 §6-13-4）
      publishedAt: row.publishedAt,
      status: getLobbyStatus(row),
    };
  };

  const repository: GameSessionRepository = {
    // ---------- 一覧 ----------

    /**
     * ダッシュボードの横断一覧（GET /api/me/game-sessions）。
     *
     * 「自分が着席している」「自分がホストのロビー」のセッションを返す。
     * どちらも終端（完了・中止）を履歴として含める（v0.2 の方針を継続）。
     */
    async findByUserId(userId: string): Promise<GameSessionListItem[]> {
      const rows = await db
        .select({ ...gameSessionColumns, ...lobbyColumns })
        .from(gameSessions)
        .innerJoin(lobbies, eq(lobbies.id, gameSessions.lobbyId))
        .where(
          sql`(
            ${lobbies.hostUserId} = ${userId}
            OR EXISTS (
              SELECT 1 FROM game_session.seats s
              JOIN lobby.lobby_entries e ON e.id = s.lobby_entry_id
              WHERE s.game_session_id = ${gameSessions.id}
                AND e.user_id = ${userId}
            )
          )`,
        )
        .orderBy(asc(gameSessions.scheduledAt), asc(gameSessions.id));

      const seatRefs = await loadSeatRefs(rows.map((r) => r.id));
      return rows.map((row) =>
        toListItem(row, toLobbyRow(row), seatRefs.get(row.id) ?? []),
      );
    },

    /** ロビー配下の開催一覧。中止・完了も含めて全件、scheduled_at・id 昇順（design-v2 §6-5） */
    async findByLobbyId(lobbyId: string): Promise<GameSessionListItem[]> {
      const rows = await db
        .select({ ...gameSessionColumns, ...lobbyColumns })
        .from(gameSessions)
        .innerJoin(lobbies, eq(lobbies.id, gameSessions.lobbyId))
        .where(eq(gameSessions.lobbyId, lobbyId))
        .orderBy(asc(gameSessions.scheduledAt), asc(gameSessions.id));

      const seatRefs = await loadSeatRefs(rows.map((r) => r.id));
      return rows.map((row) =>
        toListItem(row, toLobbyRow(row), seatRefs.get(row.id) ?? []),
      );
    },

    // ---------- 単体 ----------

    async findDetailById(id: string): Promise<GameSessionDetail | null> {
      const rows = await selectSessionWithLobby(id);
      const row = rows[0];
      if (!row) return null;

      const seatRows = await db
        .select(seatSelection)
        .from(seats)
        .leftJoin(
          characterAssignments,
          eq(characterAssignments.seatId, seats.id),
        )
        .innerJoin(lobbyEntries, eq(lobbyEntries.id, seats.lobbyEntryId))
        .leftJoin(user, eq(user.id, lobbyEntries.userId))
        .where(eq(seats.gameSessionId, id))
        .orderBy(asc(seats.createdAt), asc(seats.id));

      return {
        ...toGameSession(row, toLobbyRow(row)),
        seats: seatRows.map(toSeat),
      };
    },

    /** ホストはロビーが持つ。セッション側に host_user_id は無い（design-v2 §3-7） */
    async findHostUserId(id: string): Promise<string | null> {
      const rows = await db
        .select({ hostUserId: lobbies.hostUserId })
        .from(gameSessions)
        .innerJoin(lobbies, eq(lobbies.id, gameSessions.lobbyId))
        .where(eq(gameSessions.id, id))
        .limit(1);
      return rows[0]?.hostUserId ?? null;
    },

    /** URL の :lobbyId とセッションの実際の lobby_id の一致を検証するために使う（§6-5） */
    async findLobbyId(id: string): Promise<string | null> {
      const rows = await db
        .select({ lobbyId: gameSessions.lobbyId })
        .from(gameSessions)
        .where(eq(gameSessions.id, id))
        .limit(1);
      return rows[0]?.lobbyId ?? null;
    },

    async findStatusFields(id: string): Promise<GameSessionStatusFacts | null> {
      const rows = await db
        .select({
          scheduledAt: gameSessions.scheduledAt,
          completedAt: gameSessions.completedAt,
          cancelledAt: gameSessions.cancelledAt,
        })
        .from(gameSessions)
        .where(eq(gameSessions.id, id))
        .limit(1);

      const row = rows[0];
      if (!row) return null;
      return toStatusFacts(row);
    },

    async gameSessionExists(id: string): Promise<boolean> {
      const rows = await db
        .select({ id: gameSessions.id })
        .from(gameSessions)
        .where(eq(gameSessions.id, id))
        .limit(1);
      return rows.length > 0;
    },

    /**
     * ロビーの閲覧可否・操作可否の判定材料。
     *
     * findLobbyForViewing と findLobbyForHost は同じクエリだが、返す材料が違う。
     * 閲覧は公開ファクト（publishedAt）、ホスト操作はステータス軸のポリシー（§4-5）で
     * 判定するため、それぞれ必要な分だけを返して取り違えを型で防ぐ。
     */
    async findLobbyForViewing(lobbyId: string) {
      const lobby = await loadLobby(lobbyId);
      if (!lobby) return null;
      // 導出ステータスは意図的に落とす。閲覧可否を status で判定すると、
      // 一度も公開せず解散したロビーが draft 判定をすり抜ける（design-v2 §6-13-4）
      return { hostUserId: lobby.hostUserId, publishedAt: lobby.publishedAt };
    },

    async findLobbyForHost(lobbyId: string) {
      const lobby = await loadLobby(lobbyId);
      if (!lobby) return null;
      return { hostUserId: lobby.hostUserId, status: lobby.status };
    },

    // ---------- 書き込み ----------

    /**
     * セッションを1件作り、着席をまとめて INSERT する（design-v2 §5-2 の 5〜6）。
     *
     * 呼び出し側が executeWithLobbyLock の中で使うことを前提にしている。
     * ロック無しで呼ぶと entryIds の検証と INSERT の間に脱退が入りうる。
     */
    async createGameSession(params: {
      lobbyId: string;
      scheduledAt: string;
      entryIds: string[];
      title?: string | null;
      scenarioName?: string | null;
      description?: string | null;
      location?: string | null;
      timeLabel?: string | null;
    }): Promise<GameSession> {
      const inserted = await db
        .insert(gameSessions)
        .values({
          lobbyId: params.lobbyId,
          scheduledAt: params.scheduledAt,
          title: params.title ?? null,
          scenarioName: params.scenarioName ?? null,
          description: params.description ?? null,
          location: params.location ?? null,
          timeLabel: params.timeLabel ?? null,
        })
        .returning();

      const row = inserted[0];
      if (!row) throw new Error('セッションの作成に失敗しました');

      await db.insert(seats).values(
        params.entryIds.map((lobbyEntryId) => ({
          gameSessionId: row.id,
          lobbyEntryId,
        })),
      );

      const lobbyRows = await db
        .select(lobbyColumns)
        .from(lobbies)
        .where(eq(lobbies.id, params.lobbyId))
        .limit(1);
      const lobbyRow = lobbyRows[0];
      if (!lobbyRow) throw new Error('ロビーが見つかりません');

      return toGameSession(row, toLobbyRow(lobbyRow));
    },

    /**
     * 指定した ID のうち、そのロビーに在籍中（left_at IS NULL）の LobbyEntry の ID を返す。
     *
     * 呼び出し側は入力との差分で 422 を判定する。脱退済みの entry を着席させられないよう
     * left_at で絞るのがここの要点（design-v2 §5-2 の 4）。
     */
    async findActiveEntryIds(
      lobbyId: string,
      entryIds: string[],
    ): Promise<string[]> {
      if (entryIds.length === 0) return [];
      const rows = await db
        .select({ id: lobbyEntries.id })
        .from(lobbyEntries)
        .where(
          and(
            eq(lobbyEntries.lobbyId, lobbyId),
            inArray(lobbyEntries.id, entryIds),
            isNull(lobbyEntries.leftAt),
          ),
        );
      return rows.map((r) => r.id);
    },

    /**
     * 上書き項目は **null と undefined を区別する**。
     * null は「上書きを解除する」、キーの省略は「変更しない」（design-v2 §6-13-5）。
     */
    async updateById(
      id: string,
      input: UpdateGameSessionInput,
    ): Promise<GameSession | null> {
      const result = await db
        .update(gameSessions)
        .set({
          ...(input.scheduledAt !== undefined && {
            scheduledAt: input.scheduledAt,
          }),
          ...(input.title !== undefined && { title: input.title }),
          ...(input.scenarioName !== undefined && {
            scenarioName: input.scenarioName,
          }),
          ...(input.location !== undefined && { location: input.location }),
          ...(input.timeLabel !== undefined && { timeLabel: input.timeLabel }),
          ...(input.description !== undefined && {
            description: input.description,
          }),
        })
        .where(eq(gameSessions.id, id))
        .returning();

      const row = result[0];
      if (!row) return null;

      const lobbyRows = await db
        .select(lobbyColumns)
        .from(lobbies)
        .where(eq(lobbies.id, row.lobbyId))
        .limit(1);
      const lobbyRow = lobbyRows[0];
      if (!lobbyRow) return null;

      return toGameSession(row, toLobbyRow(lobbyRow));
    },

    async deleteById(id: string): Promise<void> {
      await db.delete(gameSessions).where(eq(gameSessions.id, id));
    },

    /**
     * completed_at が NULL の行だけを更新する（二重完了の排他）。
     * cancelled_at も NULL であることを要求し、cancel() との並行実行で
     * 両方の終端カラムが同時にセットされる二重終端状態を防ぐ。
     */
    async complete(id: string, completedAt: Date): Promise<GameSession | null> {
      return updateTerminal(id, { completedAt });
    },

    /** complete() と対称。中止も終端で、逆方向の遷移は無い */
    async cancel(id: string, cancelledAt: Date): Promise<GameSession | null> {
      return updateTerminal(id, { cancelledAt });
    },

    /**
     * ホスト以外の着席者数。セッション削除の可否（着席者がホスト本人のみか）に使う。
     * ゲストの着席は user_id が NULL なので「ホスト以外」に数える。
     */
    async countOtherSeats(id: string, hostUserId: string): Promise<number> {
      const result = await db
        .select({ cnt: count() })
        .from(seats)
        .innerJoin(lobbyEntries, eq(lobbyEntries.id, seats.lobbyEntryId))
        .where(
          and(
            eq(seats.gameSessionId, id),
            sql`(${lobbyEntries.userId} IS NULL OR ${lobbyEntries.userId} != ${hostUserId})`,
          ),
        );
      return Number(result[0]?.cnt ?? 0);
    },

    /**
     * セッション行に排他ロックを取り、コールバックを1トランザクションで実行する。
     *
     * 「条件チェック → 更新」を別クエリに分けると、その間に他リクエストが
     * 着席や状態変更を行った場合に古い読み取りを根拠に書いてしまう（TOCTOU）。
     */
    async executeWithLock<T>(
      id: string,
      fn: (lockedRepo: GameSessionRepository) => Promise<T>,
    ): Promise<T> {
      return db.transaction(async (tx) => {
        await tx
          .select({ id: gameSessions.id })
          .from(gameSessions)
          .where(eq(gameSessions.id, id))
          .for('update');

        // Drizzle の tx は PgTransaction、Database は PostgresJsDatabase で兄弟型のため
        // 直接代入できないが、ここで使う select/insert/update/delete はどちらも
        // PgDatabase から継承した同一インターフェースで、ランタイム挙動も同じ
        return fn(createGameSessionRepository(tx as unknown as Database));
      });
    },

    /**
     * セッション作成用のロック（design-v2 §5-2）。
     *
     * ロビー行を `FOR UPDATE` で取り、着席させる LobbyEntry を `FOR KEY SHARE` で押さえる。
     * ロビー側を排他にするのは同一ロビーへの並行作成を直列化するため。
     * entry 側を KEY SHARE に留めるのは、行の削除・キー変更（＝脱退による参照切れ）だけを
     * 防げばよく、回答の更新など他の書き込みまで止める必要が無いため。
     */
    async executeWithLobbyLock<T>(
      lobbyId: string,
      entryIds: string[],
      fn: (lockedRepo: GameSessionRepository) => Promise<T>,
    ): Promise<T> {
      return db.transaction(async (tx) => {
        await tx
          .select({ id: lobbies.id })
          .from(lobbies)
          .where(eq(lobbies.id, lobbyId))
          .for('update');

        if (entryIds.length > 0) {
          await tx
            .select({ id: lobbyEntries.id })
            .from(lobbyEntries)
            .where(inArray(lobbyEntries.id, entryIds))
            // `OF` は付けない。drizzle がスキーマ修飾名を出すが PostgreSQL は
            // `FOR ... OF` に非修飾のリレーション名しか許さない。
            // このクエリは lobby_entries しか読まないので `OF` 無しで同じ行が対象になる
            .for('key share');
        }

        return fn(createGameSessionRepository(tx as unknown as Database));
      });
    },

    // ---------- 着席 ----------

    async findSeatsByGameSessionId(gameSessionId: string): Promise<Seat[]> {
      const rows = await db
        .select(seatSelection)
        .from(seats)
        .leftJoin(
          characterAssignments,
          eq(characterAssignments.seatId, seats.id),
        )
        .innerJoin(lobbyEntries, eq(lobbyEntries.id, seats.lobbyEntryId))
        .leftJoin(user, eq(user.id, lobbyEntries.userId))
        .where(eq(seats.gameSessionId, gameSessionId))
        .orderBy(asc(seats.createdAt), asc(seats.id));
      return rows.map(toSeat);
    },

    async findSeatById(seatId: string): Promise<Seat | null> {
      const rows = await db
        .select(seatSelection)
        .from(seats)
        .leftJoin(
          characterAssignments,
          eq(characterAssignments.seatId, seats.id),
        )
        .innerJoin(lobbyEntries, eq(lobbyEntries.id, seats.lobbyEntryId))
        .leftJoin(user, eq(user.id, lobbyEntries.userId))
        .where(eq(seats.id, seatId))
        .limit(1);
      const row = rows[0];
      return row ? toSeat(row) : null;
    },

    /** 席の所属と本人性の判定材料。離席・キャラ名更新の権限チェックに使う */
    async findSeatOwner(
      seatId: string,
    ): Promise<{ gameSessionId: string; userId: string | null } | null> {
      const rows = await db
        .select({
          gameSessionId: seats.gameSessionId,
          userId: lobbyEntries.userId,
        })
        .from(seats)
        .innerJoin(lobbyEntries, eq(lobbyEntries.id, seats.lobbyEntryId))
        .where(eq(seats.id, seatId))
        .limit(1);
      return rows[0] ?? null;
    },

    /** その人がそのセッションに着席しているか。プレイメモの本人判定に使う */
    async findSeatByUserId(
      gameSessionId: string,
      userId: string,
    ): Promise<string | null> {
      const rows = await db
        .select({ id: seats.id })
        .from(seats)
        .innerJoin(lobbyEntries, eq(lobbyEntries.id, seats.lobbyEntryId))
        .where(
          and(
            eq(seats.gameSessionId, gameSessionId),
            eq(lobbyEntries.userId, userId),
          ),
        )
        .limit(1);
      return rows[0]?.id ?? null;
    },

    /**
     * 着席させる。null は unique 制約違反（すでに着席済み）を表す。
     *
     * lobby_entry_id のロビーと game_session の lobby_id の一致は DB 制約では
     * 表現できないため、呼び出し側が検証する（design-v2 §3-8）。
     */
    async addSeat(
      gameSessionId: string,
      lobbyEntryId: string,
    ): Promise<Seat | null> {
      const inserted = await db
        .insert(seats)
        .values({ gameSessionId, lobbyEntryId })
        .onConflictDoNothing()
        .returning({ id: seats.id });

      const row = inserted[0];
      if (!row) return null;
      return repository.findSeatById(row.id);
    },

    /** 着席が指す LobbyEntry のロビー。§3-8 の不変条件の検証に使う */
    async findEntryLobbyId(entryId: string): Promise<string | null> {
      const rows = await db
        .select({ lobbyId: lobbyEntries.lobbyId })
        .from(lobbyEntries)
        .where(and(eq(lobbyEntries.id, entryId), isNull(lobbyEntries.leftAt)))
        .limit(1);
      return rows[0]?.lobbyId ?? null;
    },

    /**
     * 着席のキャラクター名を割り当て・解除する。
     *
     * 存在確認と書き込みを1つのトランザクションにまとめ、`seats` の行を
     * `FOR UPDATE` で押さえてから触る。ロック無しで存在確認すると、その直後に
     * 離席が commit されたときに `character_assignments` の INSERT が FK 違反で
     * 落ち、消えた席を 404 で表すはずの経路から 500 が漏れる。
     * ロックを取れば、離席は待たされるか、先に commit 済みなら行が見つからず
     * `null`（= 404）になる。
     */
    async updateSeatCharacterName(
      seatId: string,
      characterName: string | null,
    ): Promise<Seat | null> {
      return db.transaction(async (tx) => {
        const locked = await tx
          .select({ id: seats.id })
          .from(seats)
          .where(eq(seats.id, seatId))
          .for('update');
        if (locked.length === 0) return null;

        if (characterName === null) {
          await tx
            .delete(characterAssignments)
            .where(eq(characterAssignments.seatId, seatId));
        } else {
          await tx
            .insert(characterAssignments)
            .values({ seatId, characterName })
            .onConflictDoUpdate({
              target: characterAssignments.seatId,
              set: { characterName },
            });
        }

        // 同じトランザクションから読み直す。外の repository で読むと
        // ここでの書き込みが見えない
        return createGameSessionRepository(
          tx as unknown as Database,
        ).findSeatById(seatId);
      });
    },

    async deleteSeatById(seatId: string): Promise<void> {
      await db.delete(seats).where(eq(seats.id, seatId));
    },

    // ---------- プレイメモ ----------
    //
    // ぶら下がり先が v0.2 のメンバー行から seats.id に変わっただけで、
    // リクエスト・レスポンスの形は変えない（design-v2 §6-15 の等価性の基準点）。

    async findPlayMemoBySeatId(
      seatId: string,
    ): Promise<GameSessionPlayMemo | null> {
      const rows = await db
        .select({
          seatId: playMemos.seatId,
          body: playMemos.body,
          sharedAt: playMemos.sharedAt,
          updatedAt: playMemos.updatedAt,
        })
        .from(playMemos)
        .where(eq(playMemos.seatId, seatId))
        .limit(1);

      const row = rows[0];
      return row ? toPlayMemo(row) : null;
    },

    /** 衝突キーは seat_id の unique 制約（1着席1メモ）。shared_at は更新しない */
    async upsertPlayMemo(
      seatId: string,
      body: string,
    ): Promise<GameSessionPlayMemo> {
      const result = await db
        .insert(playMemos)
        .values({ seatId, body })
        .onConflictDoUpdate({
          target: playMemos.seatId,
          set: { body },
        })
        .returning();

      const row = result[0];
      if (!row) throw new Error('プレイメモの保存に失敗しました');
      return toPlayMemo({ ...row, seatId: row.seatId });
    },

    /** body は書き換えない。更新対象が無い＝メモ未作成で、呼び出し側が 404 にする */
    async updatePlayMemoVisibility(
      seatId: string,
      sharedAt: Date | null,
    ): Promise<GameSessionPlayMemo | null> {
      const result = await db
        .update(playMemos)
        .set({ sharedAt })
        .where(eq(playMemos.seatId, seatId))
        .returning();

      const row = result[0];
      if (!row) return null;
      return toPlayMemo({ ...row, seatId: row.seatId });
    },

    /**
     * 絞り込みは「そのセッションの着席者のメモ」かつ「公開済み」の2条件のみ。
     * 閲覧者による分岐は作らない（design-v1.2 §4）。
     */
    async findSharedPlayMemos(
      gameSessionId: string,
    ): Promise<SharedGameSessionPlayMemo[]> {
      const rows = await db
        .select({
          seatId: playMemos.seatId,
          body: playMemos.body,
          sharedAt: playMemos.sharedAt,
          updatedAt: playMemos.updatedAt,
        })
        .from(playMemos)
        .innerJoin(seats, eq(seats.id, playMemos.seatId))
        .where(
          and(
            eq(seats.gameSessionId, gameSessionId),
            isNotNull(playMemos.sharedAt),
          ),
        )
        .orderBy(asc(playMemos.sharedAt));

      // where で公開済みに絞っているが型には反映されないため、ここでも null を落とす
      return rows
        .map(toPlayMemo)
        .filter((memo): memo is SharedGameSessionPlayMemo =>
          Boolean(memo.sharedAt),
        );
    },
  };

  /** complete / cancel の共通部分。どちらも「まだ終端でない行」だけを更新する */
  const updateTerminal = async (
    id: string,
    patch: { completedAt?: Date; cancelledAt?: Date },
  ): Promise<GameSession | null> => {
    const result = await db
      .update(gameSessions)
      .set(patch)
      .where(
        and(
          eq(gameSessions.id, id),
          isNull(gameSessions.completedAt),
          isNull(gameSessions.cancelledAt),
        ),
      )
      .returning();

    const row = result[0];
    if (!row) return null;

    const lobbyRows = await db
      .select(lobbyColumns)
      .from(lobbies)
      .where(eq(lobbies.id, row.lobbyId))
      .limit(1);
    const lobbyRow = lobbyRows[0];
    if (!lobbyRow) return null;

    return toGameSession(row, toLobbyRow(lobbyRow));
  };

  return repository;
};
