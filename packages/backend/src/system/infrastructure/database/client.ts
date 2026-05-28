import { drizzle } from 'drizzle-orm/postgres-js';
import postgres from 'postgres';
import * as schema from './schema';

/**
 * PostgreSQL クライアントと Drizzle の組み合わせを生成します。
 * データベース接続はファクトリにして、テスト時に差し替え可能にします。
 */
export const createDatabase = (databaseUrl: string) => {
  const client = postgres(databaseUrl);

  return drizzle(client, { schema });
};

export type Database = ReturnType<typeof createDatabase>;
