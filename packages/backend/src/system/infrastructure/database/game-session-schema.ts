import {
  boolean,
  date,
  index,
  integer,
  pgSchema,
  text,
  timestamp,
  uniqueIndex,
  uuid,
} from 'drizzle-orm/pg-core';
import { relations, sql } from 'drizzle-orm';
import { user } from '@/system/infrastructure/database/schema';
import {
  lobbies,
  lobbyMembers,
} from '@/system/infrastructure/database/lobby-schema';

/**
 * 卓（ゲームセッション）機能用の PostgreSQL スキーマです。
 * 機能ごとにスキーマを分離する方針（ADR 0005）に基づきます。
 */
export const gameSessionSchema = pgSchema('game_session');

export const gameSessions = gameSessionSchema.table(
  'game_sessions',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    hostUserId: text('host_user_id')
      .notNull()
      .references(() => user.id),
    title: text('title').notNull(),
    scenarioName: text('scenario_name'),
    description: text('description'),
    location: text('location'),
    maxPlayers: integer('max_players'),
    guestLinkToken: text('guest_link_token').notNull(),
    isPublished: boolean('is_published').notNull().default(false),
    openUntil: date('open_until'),
    scheduledAt: date('scheduled_at'),
    completedAt: timestamp('completed_at'),
    cancelledAt: timestamp('cancelled_at'),
    // 出自の募集枠。直接卓立ては null（design-v1.1 §3）
    lobbyId: uuid('lobby_id').references(() => lobbies.id, {
      onDelete: 'set null',
    }),
    createdAt: timestamp('created_at').notNull().defaultNow(),
    updatedAt: timestamp('updated_at')
      .notNull()
      .defaultNow()
      .$onUpdate(() => new Date()),
  },
  (table) => ({
    // lobby_id は ON DELETE SET NULL の FK。インデックスがないと募集枠削除時に
    // 参照側（本テーブル）がフルスキャンされるため付与する。
    lobbyIdIdx: index('game_sessions_lobby_id_idx').on(table.lobbyId),
  }),
);

export const gameSessionMembers = gameSessionSchema.table(
  'game_session_members',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    gameSessionId: uuid('game_session_id')
      .notNull()
      .references(() => gameSessions.id, { onDelete: 'cascade' }),
    userId: text('user_id').references(() => user.id),
    guestName: text('guest_name'),
    characterName: text('character_name'),
    // 卓確定でコピーされたメンバーの出自（募集枠メンバーID）。直接参加は null（design-v1.1 §3）
    lobbyMemberId: uuid('lobby_member_id').references(() => lobbyMembers.id, {
      onDelete: 'set null',
    }),
    createdAt: timestamp('created_at').notNull().defaultNow(),
    updatedAt: timestamp('updated_at')
      .notNull()
      .defaultNow()
      .$onUpdate(() => new Date()),
  },
  (table) => ({
    // ログインユーザーの重複参加を防ぐ partial unique index（user_id が NULL のゲストは対象外）
    userUniqueIdx: uniqueIndex(
      'game_session_members_game_session_id_user_id_unique',
    )
      .on(table.gameSessionId, table.userId)
      .where(sql`${table.userId} IS NOT NULL`),
    // lobby_member_id は ON DELETE SET NULL の FK。インデックスがないと募集枠メンバー
    // 削除時に参照側（本テーブル）がフルスキャンされるため付与する。
    lobbyMemberIdIdx: index('game_session_members_lobby_member_id_idx').on(
      table.lobbyMemberId,
    ),
  }),
);

export const gameSessionsRelations = relations(
  gameSessions,
  ({ one, many }) => ({
    host: one(user, {
      fields: [gameSessions.hostUserId],
      references: [user.id],
    }),
    lobby: one(lobbies, {
      fields: [gameSessions.lobbyId],
      references: [lobbies.id],
    }),
    members: many(gameSessionMembers),
  }),
);

export const gameSessionMembersRelations = relations(
  gameSessionMembers,
  ({ one }) => ({
    gameSession: one(gameSessions, {
      fields: [gameSessionMembers.gameSessionId],
      references: [gameSessions.id],
    }),
    user: one(user, {
      fields: [gameSessionMembers.userId],
      references: [user.id],
    }),
    lobbyMember: one(lobbyMembers, {
      fields: [gameSessionMembers.lobbyMemberId],
      references: [lobbyMembers.id],
    }),
  }),
);
