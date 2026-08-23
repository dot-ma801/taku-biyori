/**
 * 実 DB に対するテストの接続とトランザクション境界を扱うヘルパー。
 *
 * 方針（migration-plan-concept-model.md §2 タスク0）:
 * - Testcontainers も PGlite も使わない。すでに動いている PostgreSQL に
 *   テスト用データベースを1つ足し、`TEST_DATABASE_URL` で接続先を切り替える
 * - テスト間の分離は **各テストをトランザクションで包んでロールバック** する。
 *   TRUNCATE 不要で速く、テストが並行に走っても互いの未コミットデータが見えない
 * - `SELECT ... FOR UPDATE` の競合だけはロールバック方式では再現できない
 *   （同一トランザクション内では自分のロックと競合しないため）。
 *   そのケースは `withCommitted` で本当にコミットし、後片付けを明示的に行う
 *
 * ⚠️ **不変条件（並行実行の前提）**: `withCommitted` でコミットした行は、
 * `withRollback` の行と違って**他のテストファイル・他ワーカーからも見える**。
 * vitest はテストファイルを並行に走らせるため、`withCommitted` を使うテストで
 * 「一覧を取得して `toHaveLength(N)` で全体件数を assert する」ような書き方を
 * すると、たまたま同時に走った別の `withCommitted` テストの行を巻き込んで
 * flaky になる。一覧系のアサーションは必ず `find`/`filter` で自分が作った
 * fixture の ID に絞ってから行うこと（本ファイル内の既存テストを参照）。
 *
 * `getTestDatabase` の `{ max: 5 }` は、1ワーカーが同時に複数のトランザクション
 * を開くロック競合テスト（`row-lock-contention.test.ts` は同一ワーカー内で
 * 複数の `executeWithLock` を並行に開く）のための接続プールサイズ。
 * 「ワーカー数 × 5 が PostgreSQL の `max_connections`（既定 100）を
 * 超えない」ことを前提にしており、CI・ローカルとも vitest のデフォルト
 * ワーカー数（CPU コア数程度）であればこの前提は成立する。
 */
import { inArray } from 'drizzle-orm';
import { drizzle } from 'drizzle-orm/postgres-js';
import postgres from 'postgres';
import type { Sql } from 'postgres';
import type { Database } from '@/system/infrastructure/database/client';
import * as authSchema from '@/system/infrastructure/database/schema';
import * as gameSessionSchema from '@/system/infrastructure/database/game-session-schema';
import * as lobbySchema from '@/system/infrastructure/database/lobby-schema';
import { assertDistinctFromDatabaseUrl } from '@/system/infrastructure/database/assert-distinct-database-url';

const schema = { ...authSchema, ...gameSessionSchema, ...lobbySchema };

export const getTestDatabaseUrl = (): string => {
  const url = process.env.TEST_DATABASE_URL;

  if (!url) {
    throw new Error(
      [
        'TEST_DATABASE_URL が設定されていません。',
        'packages/backend/.env に TEST_DATABASE_URL を追加し、',
        '`pnpm --filter @taku-biyori/backend db:test:setup` を実行してください。',
      ].join('\n'),
    );
  }

  assertDistinctFromDatabaseUrl(url, process.env.DATABASE_URL);

  return url;
};

let client: Sql | undefined;
let database: Database | undefined;

/**
 * テスト用 DB への接続を1ワーカーにつき1つだけ作って使い回す。
 * ロック競合のテストが同時に複数のトランザクションを開くため、プールは複数接続を許す。
 */
export const getTestDatabase = (): Database => {
  if (!database) {
    client = postgres(getTestDatabaseUrl(), { max: 5 });
    database = drizzle(client, { schema });
  }

  return database;
};

export const closeTestDatabase = async (): Promise<void> => {
  if (client) {
    await client.end();
  }
  client = undefined;
  database = undefined;
};

/** トランザクションを巻き戻すためだけの内部シグナル。テストの失敗としては扱わない */
class RollbackSignal extends Error {
  constructor() {
    super('rollback');
    this.name = 'RollbackSignal';
  }
}

/**
 * コールバックをトランザクションの中で実行し、最後に必ずロールバックする。
 *
 * 渡される `Database` はトランザクションハンドルなので、この中の書き込みは
 * 他の接続からは見えず、テスト終了時に消える。リポジトリが内部で
 * `db.transaction()` を呼んだ場合は SAVEPOINT にネストされる。
 */
export const withRollback = async (
  fn: (db: Database) => Promise<void>,
): Promise<void> => {
  try {
    await getTestDatabase().transaction(async (tx) => {
      // Drizzle の tx（PgTransaction）と Database（PostgresJsDatabase）は兄弟型で
      // 直接代入できないが、リポジトリが使う API は同一インターフェース。
      // 本番コード（createXxxRepository の executeWithLock）と同じ扱い方に揃える。
      await fn(tx as unknown as Database);
      throw new RollbackSignal();
    });
  } catch (error) {
    if (error instanceof RollbackSignal) {
      return;
    }
    throw error;
  }
};

export type FixtureKind = 'gameSession' | 'lobby' | 'user';

/** `withCommitted` の中で作った行を後片付けの対象として登録する */
export type TrackFixture = (kind: FixtureKind, id: string) => void;

/**
 * ロック競合のテスト用。コールバックの中の書き込みは**本当にコミットされる**ため、
 * `track` で登録した行を最後に消す。
 *
 * `withRollback` が使えないのは、`SELECT ... FOR UPDATE` の待ちを再現するには
 * 別々のトランザクション（＝別接続）が必要なため。
 */
/**
 * 登録された fixture を1トランザクションで削除する。
 *
 * gameSession → lobby → user の順に消す（メンバー・候補日・回答は FK の
 * ON DELETE CASCADE で一緒に消えるため個別に追跡しない）。この順序は
 * `lobbies.host_user_id` / `lobby_members.user_id` などが `user` を
 * cascade なしで参照しているため、user を最後に消さないと FK 違反になる。
 * 1トランザクションにまとめているのは、途中の delete が失敗したときに
 * それより前の delete だけがコミットされて共有テスト DB に行が残る
 * （部分的な後片付け漏れ）事態を避けるため。
 */
const cleanupCommitted = async (
  db: Database,
  created: { kind: FixtureKind; id: string }[],
): Promise<void> => {
  await db.transaction(async (tx) => {
    const gameSessionIds = idsOf(created, 'gameSession');
    if (gameSessionIds.length > 0) {
      await tx
        .delete(gameSessionSchema.gameSessions)
        .where(inArray(gameSessionSchema.gameSessions.id, gameSessionIds));
    }

    const lobbyIds = idsOf(created, 'lobby');
    if (lobbyIds.length > 0) {
      await tx
        .delete(lobbySchema.lobbies)
        .where(inArray(lobbySchema.lobbies.id, lobbyIds));
    }

    const userIds = idsOf(created, 'user');
    if (userIds.length > 0) {
      await tx
        .delete(authSchema.user)
        .where(inArray(authSchema.user.id, userIds));
    }
  });
};

export const withCommitted = async (
  fn: (db: Database, track: TrackFixture) => Promise<void>,
): Promise<void> => {
  const db = getTestDatabase();
  const created: { kind: FixtureKind; id: string }[] = [];

  // コールバック（テスト本体）のエラーを最優先で伝える。クリーンアップ自体が
  // 失敗しても、それによってテスト本来の失敗が握り潰されないようにする。
  let testError: unknown;
  let testFailed = false;
  try {
    await fn(db, (kind, id) => {
      created.push({ kind, id });
    });
  } catch (error) {
    testFailed = true;
    testError = error;
  }

  try {
    await cleanupCommitted(db, created);
  } catch (cleanupError) {
    if (testFailed) {
      console.error(
        'withCommitted: クリーンアップにも失敗しました（テスト本来の失敗を優先して再送出します）:',
        cleanupError,
      );
      throw testError;
    }
    throw cleanupError;
  }

  if (testFailed) {
    throw testError;
  }
};

const idsOf = (
  created: { kind: FixtureKind; id: string }[],
  kind: FixtureKind,
): string[] => created.filter((row) => row.kind === kind).map((row) => row.id);
