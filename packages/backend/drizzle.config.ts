/// <reference types="node" />
import 'dotenv/config';
import { defineConfig } from 'drizzle-kit';

const databaseUrl = process.env.DATABASE_URL;

if (!databaseUrl) {
  throw new Error('DATABASE_URL is required for drizzle config');
}

export default defineConfig({
  dialect: 'postgresql',
  schema: './src/system/infrastructure/database/schema.ts',
  out: './drizzle',
  dbCredentials: {
    url: databaseUrl,
  },
});
