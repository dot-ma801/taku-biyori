import {
  and,
  asc,
  count,
  eq,
  exists,
  inArray,
  isNotNull,
  isNull,
  or,
  sql,
  getTableColumns,
} from 'drizzle-orm';
import type {
  Lobby,
  LobbyDetail,
  LobbyEntry,
  LobbyListItem,
  LobbyAvailabilityDate,
  LobbyAvailabilityDateAnswer,
  JoinLobbyInput,
  JoinLobbyAsGuestInput,
  UpdateLobbyInput,
  UpdateLobbyAvailabilityDateResponseInput,
} from '@taku-biyori/shared';
import { LobbyStatus, getLobbyStatus } from '@taku-biyori/shared';
import type { Database } from '@/system/infrastructure/database/client';
import {
  lobbies,
  lobbyEntries,
  lobbyCandidates,
  lobbyAnswers,
} from '@/system/infrastructure/database/lobby-schema';
import { user } from '@/system/infrastructure/database/schema';
import type { CandidateDateDiff } from '@/lobby/domain/candidate-date-diff';
import type { ListLobbiesRepository } from '@/lobby/application/list-lobbies';
import type { CreateLobbyRepository } from '@/lobby/application/create-lobby';
import type { GetLobbyRepository } from '@/lobby/application/get-lobby';
import type { UpdateLobbyRepository } from '@/lobby/application/update-lobby';
import type { DeleteLobbyRepository } from '@/lobby/application/delete-lobby';
import type { UpdateLobbyStatusRepository } from '@/lobby/application/update-lobby-status';
import type { ListEntriesRepository } from '@/lobby/application/list-entries';
import type { JoinLobbyRepository } from '@/lobby/application/join-lobby';
import type { JoinAsGuestRepository } from '@/lobby/application/join-as-guest';
import type { LeaveLobbyRepository } from '@/lobby/application/leave-lobby';
import type { GetGuestLinkRepository } from '@/lobby/application/get-guest-link';
import type { RegenerateGuestLinkRepository } from '@/lobby/application/regenerate-guest-link';
import type { ListAvailabilityDatesRepository } from '@/lobby/application/list-availability-dates';
import type { BulkUpdateAvailabilityDatesRepository } from '@/lobby/application/bulk-update-availability-dates';
import type { UpdateAvailabilityDateResponseRepository } from '@/lobby/application/update-availability-date-response';
import type { UpdateGuestAvailabilityDateResponseRepository } from '@/lobby/application/update-guest-availability-date-response';

export type LobbyRepository = ListLobbiesRepository &
  CreateLobbyRepository &
  GetLobbyRepository &
  UpdateLobbyRepository &
  DeleteLobbyRepository &
  UpdateLobbyStatusRepository &
  ListEntriesRepository &
  JoinLobbyRepository &
  JoinAsGuestRepository &
  LeaveLobbyRepository &
  GetGuestLinkRepository &
  RegenerateGuestLinkRepository &
  ListAvailabilityDatesRepository &
  BulkUpdateAvailabilityDatesRepository &
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
  publishedAt: Date | null;
  openUntil: string | null;
  receptionClosedAt: Date | null;
  disbandedAt: Date | null;
  createdAt: Date;
  updatedAt: Date;
};

type EntryRow = {
  id: string;
  userId: string | null;
  userName: string | null;
  guestName: string | null;
  createdAt: Date;
  leftAt: Date | null;
};

const toIso = (d: Date | null): string | null => d?.toISOString() ?? null;

const statusOf = (row: LobbyRow): LobbyStatus =>
  getLobbyStatus({
    publishedAt: row.publishedAt,
    openUntil: row.openUntil,
    receptionClosedAt: row.receptionClosedAt,
    disbandedAt: row.disbandedAt,
  });

const toEntry = (row: EntryRow): LobbyEntry => ({
  id: row.id,
  userId: row.userId,
  userName: row.userName ?? null,
  guestName: row.guestName,
  joinedAt: row.createdAt.toISOString(),
  leftAt: toIso(row.leftAt),
});

const toLobby = (row: LobbyRow): Lobby => ({
  id: row.id,
  title: row.title,
  description: row.description,
  scenarioName: row.scenarioName,
  location: row.location,
  status: statusOf(row),
  publishedAt: toIso(row.publishedAt),
  maxPlayers: row.maxPlayers,
  openUntil: row.openUntil,
  receptionClosedAt: toIso(row.receptionClosedAt),
  disbandedAt: toIso(row.disbandedAt),
  hostUserId: row.hostUserId,
  createdAt: row.createdAt.toISOString(),
  updatedAt: row.updatedAt.toISOString(),
});

const toListItem = (row: LobbyRow, entries: LobbyEntry[]): LobbyListItem => ({
  id: row.id,
  title: row.title,
  scenarioName: row.scenarioName,
  status: statusOf(row),
  publishedAt: toIso(row.publishedAt),
  openUntil: row.openUntil,
  receptionClosedAt: toIso(row.receptionClosedAt),
  maxPlayers: row.maxPlayers,
  entries,
  hostUserId: row.hostUserId,
  createdAt: row.createdAt.toISOString(),
  updatedAt: row.updatedAt.toISOString(),
});

/**
 * 参加者を「ホストが先頭、以降 joinedAt 昇順」に並べる（design-v2 §6-13-4）。
 * 脱退済みかどうかは並び順に影響しない。
 */
const sortEntries = (entries: LobbyEntry[], hostUserId: string): LobbyEntry[] =>
  [...entries].sort((a, b) => {
    const aIsHost = a.userId === hostUserId;
    const bIsHost = b.userId === hostUserId;
    if (aIsHost !== bIsHost) return aIsHost ? -1 : 1;
    return a.joinedAt.localeCompare(b.joinedAt);
  });

export const createLobbyRepository = (db: Database): LobbyRepository => ({
  async findByUserId(userId: string): Promise<LobbyListItem[]> {
    const rows = await db
      .select(getTableColumns(lobbies))
      .from(lobbies)
      .where(
        or(
          eq(lobbies.hostUserId, userId),
          exists(
            db
              .select({ id: lobbyEntries.id })
              .from(lobbyEntries)
              .where(
                and(
                  eq(lobbyEntries.lobbyId, lobbies.id),
                  eq(lobbyEntries.userId, userId),
                  isNull(lobbyEntries.leftAt),
                ),
              ),
          ),
          // 公開かつ受付中のロビーは、参加していなくても一覧に出す（探索用）
          and(
            isNotNull(lobbies.publishedAt),
            isNull(lobbies.disbandedAt),
            isNull(lobbies.receptionClosedAt),
            or(
              isNull(lobbies.openUntil),
              sql`${lobbies.openUntil} >= CURRENT_DATE`,
            ),
          ),
        ),
      );

    if (rows.length === 0) return [];

    const entryRows = await db
      .select({
        lobbyId: lobbyEntries.lobbyId,
        id: lobbyEntries.id,
        userId: lobbyEntries.userId,
        userName: user.name,
        guestName: lobbyEntries.guestName,
        createdAt: lobbyEntries.createdAt,
        leftAt: lobbyEntries.leftAt,
      })
      .from(lobbyEntries)
      .leftJoin(user, eq(user.id, lobbyEntries.userId))
      .where(
        inArray(
          lobbyEntries.lobbyId,
          rows.map((r) => r.id),
        ),
      )
      .orderBy(asc(lobbyEntries.createdAt));

    const entriesByLobby = new Map<string, LobbyEntry[]>();
    for (const row of entryRows) {
      const list = entriesByLobby.get(row.lobbyId) ?? [];
      list.push(toEntry(row));
      entriesByLobby.set(row.lobbyId, list);
    }

    return rows.map((row) =>
      toListItem(
        row,
        sortEntries(entriesByLobby.get(row.id) ?? [], row.hostUserId),
      ),
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
    const lobbyRow = await db
      .select()
      .from(lobbies)
      .where(eq(lobbies.id, id))
      .limit(1);

    const row = lobbyRow[0];
    if (!row) return null;

    // 参加者一覧は脱退者も含めて全件返す（leftAt で見分ける。design-v2 §6-13-4）
    const entries = await this.findEntriesByLobbyId(id);

    return { ...toLobby(row), entries };
  },

  async findLobbyById(id: string): Promise<Lobby | null> {
    const row = await db
      .select()
      .from(lobbies)
      .where(eq(lobbies.id, id))
      .limit(1);
    return row[0] ? toLobby(row[0]) : null;
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

  async countOtherEntries(id: string, hostUserId: string): Promise<number> {
    // 脱退済みも数える。「他人が居た痕跡」があるロビーは削除させない（design-v2 §6-13-3）
    const result = await db
      .select({ cnt: count() })
      .from(lobbyEntries)
      .where(
        and(
          eq(lobbyEntries.lobbyId, id),
          or(
            isNull(lobbyEntries.userId),
            sql`${lobbyEntries.userId} != ${hostUserId}`,
          ),
        ),
      );
    return result[0]?.cnt ?? 0;
  },

  async executeWithLock(id, fn) {
    // 削除フローの TOCTOU 対策:
    // トランザクション開始直後に対象ロビー行へ `SELECT ... FOR UPDATE` で
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
        publishedAt: lobbies.publishedAt,
        openUntil: lobbies.openUntil,
        receptionClosedAt: lobbies.receptionClosedAt,
        disbandedAt: lobbies.disbandedAt,
      })
      .from(lobbies)
      .where(eq(lobbies.id, id))
      .limit(1);

    return row[0] ?? null;
  },

  async publish(id: string): Promise<Lobby | null> {
    // 公開は一度きり。条件付き UPDATE で並行実行時の二重公開を DB レベルでも弾く
    const result = await db
      .update(lobbies)
      .set({ publishedAt: new Date() })
      .where(and(eq(lobbies.id, id), isNull(lobbies.publishedAt)))
      .returning();

    const row = result[0];
    if (!row) return null;
    return toLobby(row);
  },

  async closeReception(id: string): Promise<Lobby | null> {
    const result = await db
      .update(lobbies)
      .set({ receptionClosedAt: new Date() })
      .where(and(eq(lobbies.id, id), isNull(lobbies.receptionClosedAt)))
      .returning();

    const row = result[0];
    if (!row) return null;
    return toLobby(row);
  },

  async reopenReception(id: string): Promise<Lobby | null> {
    // 追加募集。締め切り日が過ぎたままだと reception_closed_at を消しても closed のままなので、
    // 過去日の open_until は無期限受付（NULL）に戻す（design-v2 §4-1）
    const result = await db
      .update(lobbies)
      .set({
        receptionClosedAt: null,
        openUntil: sql`CASE WHEN ${lobbies.openUntil} < CURRENT_DATE THEN NULL ELSE ${lobbies.openUntil} END`,
      })
      .where(eq(lobbies.id, id))
      .returning();

    const row = result[0];
    if (!row) return null;
    return toLobby(row);
  },

  async disband(id: string): Promise<Lobby | null> {
    // 解散は一度きり。application 層のステータスチェックだけでは
    // 並行実行で二重に解散され得るため、条件付き UPDATE で DB レベルでも排他を担保する。
    const result = await db
      .update(lobbies)
      .set({ disbandedAt: new Date() })
      .where(and(eq(lobbies.id, id), isNull(lobbies.disbandedAt)))
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
          publishedAt: null,
        })
        .returning();

      const row = result[0];
      if (!row) throw new Error('ロビーの作成に失敗しました');

      await tx.insert(lobbyEntries).values({
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
  ): Promise<{ publishedAt: Date | null; hostUserId: string } | null> {
    const row = await db
      .select({
        publishedAt: lobbies.publishedAt,
        hostUserId: lobbies.hostUserId,
      })
      .from(lobbies)
      .where(eq(lobbies.id, id))
      .limit(1);
    return row[0] ?? null;
  },

  async findEntriesByLobbyId(lobbyId: string): Promise<LobbyEntry[]> {
    const hostUserId = await this.findHostUserId(lobbyId);

    const rows = await db
      .select({
        id: lobbyEntries.id,
        userId: lobbyEntries.userId,
        userName: user.name,
        guestName: lobbyEntries.guestName,
        createdAt: lobbyEntries.createdAt,
        leftAt: lobbyEntries.leftAt,
      })
      .from(lobbyEntries)
      .leftJoin(user, eq(user.id, lobbyEntries.userId))
      .where(eq(lobbyEntries.lobbyId, lobbyId))
      .orderBy(asc(lobbyEntries.createdAt));

    const entries = rows.map(toEntry);
    return hostUserId ? sortEntries(entries, hostUserId) : entries;
  },

  async findActiveEntryByUserId(
    lobbyId: string,
    userId: string,
  ): Promise<string | null> {
    const row = await db
      .select({ id: lobbyEntries.id })
      .from(lobbyEntries)
      .where(
        and(
          eq(lobbyEntries.lobbyId, lobbyId),
          eq(lobbyEntries.userId, userId),
          isNull(lobbyEntries.leftAt),
        ),
      )
      .limit(1);
    return row[0]?.id ?? null;
  },

  async findEntryByUserId(
    lobbyId: string,
    userId: string,
  ): Promise<{ id: string; leftAt: Date | null } | null> {
    const row = await db
      .select({ id: lobbyEntries.id, leftAt: lobbyEntries.leftAt })
      .from(lobbyEntries)
      .where(
        and(eq(lobbyEntries.lobbyId, lobbyId), eq(lobbyEntries.userId, userId)),
      )
      .limit(1);
    return row[0] ?? null;
  },

  async addEntry(
    lobbyId: string,
    userId: string,
    _input: JoinLobbyInput,
  ): Promise<LobbyEntry | null> {
    const result = await db
      .insert(lobbyEntries)
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

    return toEntry({ ...row, userName: userRow[0]?.name ?? null });
  },

  async rejoinEntry(entryId: string): Promise<LobbyEntry | null> {
    // 再参加は新しい行を作らず left_at を NULL に戻す。
    // 過去の回答・着席・メモが繋がったまま復帰する（design-v2 §3-3）
    const result = await db
      .update(lobbyEntries)
      .set({ leftAt: null })
      .where(and(eq(lobbyEntries.id, entryId), isNotNull(lobbyEntries.leftAt)))
      .returning();

    const row = result[0];
    if (!row) return null;

    const userRow = row.userId
      ? await db
          .select({ name: user.name })
          .from(user)
          .where(eq(user.id, row.userId))
          .limit(1)
      : [];

    return toEntry({ ...row, userName: userRow[0]?.name ?? null });
  },

  async addGuestEntry(
    lobbyId: string,
    input: JoinLobbyAsGuestInput,
  ): Promise<LobbyEntry> {
    const result = await db
      .insert(lobbyEntries)
      .values({
        lobbyId,
        userId: null,
        guestName: input.guestName,
      })
      .returning();

    const row = result[0];
    if (!row) throw new Error('ゲストの参加に失敗しました');

    return toEntry({ ...row, userName: null });
  },

  async findEntryOwner(entryId: string): Promise<{
    lobbyId: string;
    userId: string | null;
    leftAt: Date | null;
  } | null> {
    const row = await db
      .select({
        lobbyId: lobbyEntries.lobbyId,
        userId: lobbyEntries.userId,
        leftAt: lobbyEntries.leftAt,
      })
      .from(lobbyEntries)
      .where(eq(lobbyEntries.id, entryId))
      .limit(1);
    return row[0] ?? null;
  },

  async markEntryLeft(entryId: string): Promise<void> {
    // 脱退はハード削除しない。回答・着席・メモが参照しているため（design-v2 §9-5）
    await db
      .update(lobbyEntries)
      .set({ leftAt: new Date() })
      .where(eq(lobbyEntries.id, entryId));
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
        activeEntryId: lobbyEntries.id,
      })
      .from(lobbyCandidates)
      // 回答表は在籍中の参加者だけを出す。脱退者の回答は残るが表には現れない
      .leftJoin(lobbyAnswers, eq(lobbyAnswers.candidateId, lobbyCandidates.id))
      .leftJoin(
        lobbyEntries,
        and(
          eq(lobbyEntries.id, lobbyAnswers.memberId),
          isNull(lobbyEntries.leftAt),
        ),
      )
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
      // LEFT JOIN なので、脱退者の回答は activeEntryId が NULL になる。
      // 回答自体は DB に残るが表には出さない（design-v2 完了条件）
      if (
        row.answerId !== null &&
        row.memberId !== null &&
        row.activeEntryId !== null
      ) {
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

  async replaceGuestLinkToken(
    id: string,
    token: string,
  ): Promise<string | null> {
    // 再発行は上書き。旧トークンは即座に無効になる（design-v2 §6-12-1）
    const result = await db
      .update(lobbies)
      .set({ guestLinkToken: token })
      .where(eq(lobbies.id, id))
      .returning({ guestLinkToken: lobbies.guestLinkToken });
    return result[0]?.guestLinkToken ?? null;
  },

  async findGuestLinkToken(id: string): Promise<string | null> {
    const row = await db
      .select({ guestLinkToken: lobbies.guestLinkToken })
      .from(lobbies)
      .where(eq(lobbies.id, id))
      .limit(1);
    return row[0]?.guestLinkToken ?? null;
  },

  async isGuestEntry(lobbyId: string, entryId: string): Promise<boolean> {
    const row = await db
      .select({ userId: lobbyEntries.userId })
      .from(lobbyEntries)
      .where(
        and(
          eq(lobbyEntries.id, entryId),
          eq(lobbyEntries.lobbyId, lobbyId),
          isNull(lobbyEntries.userId),
          // 脱退したゲスト列は回答できない
          isNull(lobbyEntries.leftAt),
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
