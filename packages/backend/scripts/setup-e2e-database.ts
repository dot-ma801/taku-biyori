/// <reference types="node" />
/**
 * e2e 用データベースを用意するスクリプト。
 *
 * `E2E_DATABASE_URL` が指すデータベースが無ければ作成し、マイグレーションを適用してから
 * シードを流す。e2e はブラウザから実際に書き込むため、ロールバックできるトランザクションの
 * 中では走らない。開発用・テスト用とは別のデータベースに隔離する。
 *
 * 実行: pnpm --filter @taku-biyori/backend db:e2e:setup
 */
import 'dotenv/config';
import { drizzle } from 'drizzle-orm/postgres-js';
import { migrate } from 'drizzle-orm/postgres-js/migrator';
import postgres from 'postgres';
import { assertDistinctFromDatabaseUrl } from '@/system/infrastructure/database/assert-distinct-database-url';

const e2eDatabaseUrl = process.env.E2E_DATABASE_URL;

if (!e2eDatabaseUrl) {
  throw new Error(
    'E2E_DATABASE_URL is required. packages/backend/.env.example を参照して設定してください',
  );
}

assertDistinctFromDatabaseUrl(
  e2eDatabaseUrl,
  process.env.DATABASE_URL,
  'E2E_DATABASE_URL',
);

const databaseNameOf = (rawUrl: string): string =>
  decodeURIComponent(new URL(rawUrl).pathname.replace(/^\//, ''));

const databaseName = databaseNameOf(e2eDatabaseUrl);

if (!databaseName) {
  throw new Error('E2E_DATABASE_URL にデータベース名が含まれていません');
}

// 同名の識別子をそのまま SQL に埋め込むため、想定外の文字を弾いておく
if (!/^[A-Za-z0-9_]+$/.test(databaseName)) {
  throw new Error(
    `e2e 用データベース名に使えない文字が含まれています: ${databaseName}`,
  );
}

// e2e はシードで作り直すため、リポジトリ層テストの DB と共有すると互いを壊す
if (
  process.env.TEST_DATABASE_URL &&
  databaseNameOf(process.env.TEST_DATABASE_URL) === databaseName
) {
  throw new Error(
    'E2E_DATABASE_URL が TEST_DATABASE_URL と同じデータベースを指しています。別名を指定してください',
  );
}

const ensureDatabaseExists = async (): Promise<void> => {
  // CREATE DATABASE は接続中のデータベース上では実行できないため、
  // 管理用の `postgres` データベースへ繋ぎ直して作成する
  const adminUrl = new URL(e2eDatabaseUrl);
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
  const client = postgres(e2eDatabaseUrl, { max: 1 });
  try {
    await migrate(drizzle(client), { migrationsFolder: './drizzle' });
    console.log(`${databaseName} にマイグレーションを適用しました`);
  } finally {
    await client.end();
  }
};

/**
 * シードは `DATABASE_URL` しか見ないため、e2e 用に差し替えてから読み込む。
 * seed.ts は import した時点で実行される。
 */
const runSeed = async (): Promise<void> => {
  process.env.DATABASE_URL = e2eDatabaseUrl;
  await import('./seed');
};

await ensureDatabaseExists();
await runMigrations();
await runSeed();
