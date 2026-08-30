/// <reference types="node" />
/**
 * テスト用データベースを用意するスクリプト。
 *
 * `TEST_DATABASE_URL` が指すデータベースが無ければ作成し、`drizzle/` のマイグレーションを
 * 適用する。ローカル（WSL の PostgreSQL へ Windows から接続）と CI（GitHub Actions の
 * `services: postgres`）のどちらでも同じコマンドで初期化できるようにするためのもの。
 *
 * `drizzle-kit migrate` は接続先を `DATABASE_URL` からしか読まないため、
 * 開発用 DB を誤って触らないようにこのスクリプト経由でマイグレーションを実行する。
 *
 * 実行: pnpm --filter @taku-biyori/backend db:test:setup
 */
import 'dotenv/config';
import { drizzle } from 'drizzle-orm/postgres-js';
import { migrate } from 'drizzle-orm/postgres-js/migrator';
import { inArray, like } from 'drizzle-orm';
import postgres from 'postgres';
import { assertDistinctFromDatabaseUrl } from '@/system/infrastructure/database/assert-distinct-database-url';
import { user } from '@/system/infrastructure/database/schema';
import { lobbies } from '@/system/infrastructure/database/lobby-schema';

const testDatabaseUrl = process.env.TEST_DATABASE_URL;

if (!testDatabaseUrl) {
  throw new Error(
    'TEST_DATABASE_URL is required. packages/backend/.env.example を参照して設定してください',
  );
}

assertDistinctFromDatabaseUrl(testDatabaseUrl, process.env.DATABASE_URL);

const url = new URL(testDatabaseUrl);
const databaseName = decodeURIComponent(url.pathname.replace(/^\//, ''));

if (!databaseName) {
  throw new Error('TEST_DATABASE_URL にデータベース名が含まれていません');
}

// 同名の識別子をそのまま SQL に埋め込むため、想定外の文字を弾いておく
if (!/^[A-Za-z0-9_]+$/.test(databaseName)) {
  throw new Error(
    `テスト用データベース名に使えない文字が含まれています: ${databaseName}`,
  );
}

const ensureDatabaseExists = async (): Promise<void> => {
  // CREATE DATABASE は接続中のデータベース上では実行できないため、
  // 管理用の `postgres` データベースへ繋ぎ直して作成する
  const adminUrl = new URL(testDatabaseUrl);
  adminUrl.pathname = '/postgres';

  const admin = postgres(adminUrl.toString(), { max: 1 });
  try {
    const rows = await admin`
      SELECT 1 FROM pg_database WHERE datname = ${databaseName}
    `;

    if (rows.length > 0) {
      console.log(`データベース ${databaseName} は既に存在します`);
      return;
    }

    await admin.unsafe(`CREATE DATABASE "${databaseName}"`);
    console.log(`データベース ${databaseName} を作成しました`);
  } finally {
    await admin.end();
  }
};

const runMigrations = async (): Promise<void> => {
  const client = postgres(testDatabaseUrl, { max: 1 });
  try {
    await migrate(drizzle(client), { migrationsFolder: './drizzle' });
    console.log(`${databaseName} にマイグレーションを適用しました`);
  } finally {
    await client.end();
  }
};

/**
 * `withCommitted`（ロック競合のテスト）はコミット済みの行を明示的に削除して
 * 後片付けするが、テスト失敗時の例外やテストランナーの強制終了などでその
 * クリーンアップ自体が実行されなかった場合、`test-user-%` プレフィックスの
 * 行が残り続ける。`db:test:setup` を実行するたびにその取りこぼしを掃除する。
 */
const cleanupLeakedTestRows = async (): Promise<void> => {
  const client = postgres(testDatabaseUrl, { max: 1 });
  const db = drizzle(client);
  try {
    const leaked = await db
      .select({ id: user.id })
      .from(user)
      .where(like(user.id, 'test-user-%'));
    const leakedUserIds = leaked.map((row) => row.id);

    if (leakedUserIds.length === 0) {
      return;
    }

    await db.transaction(async (tx) => {
      // 開催はロビーにぶら下がるようになったため ON DELETE CASCADE で一緒に消える
      await tx
        .delete(lobbies)
        .where(inArray(lobbies.hostUserId, leakedUserIds));
      await tx.delete(user).where(inArray(user.id, leakedUserIds));
    });
    console.log(
      `取りこぼした test-user-% 由来の行を ${leakedUserIds.length} 件掃除しました`,
    );
  } finally {
    await client.end();
  }
};

await ensureDatabaseExists();
await runMigrations();
await cleanupLeakedTestRows();
