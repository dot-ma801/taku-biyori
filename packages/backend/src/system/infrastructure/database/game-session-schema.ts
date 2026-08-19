import {
  boolean,
  date,
  index,
  integer,
  pgSchema,
  text,
  timestamp,
  unique,
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
    // 卓は日程が確定した状態でのみ存在するため必須（design-v1.1 §8）
    scheduledAt: date('scheduled_at').notNull(),
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

/**
 * プレイメモ（参加者が自分用に残す記録）。
 *
 * メモは卓メンバーに従属する概念で独立したライフサイクルを持たないため、
 * 新しいスキーマは切らず既存の game_session スキーマに同居させる（design-v1.2 §2）。
 * 卓の紐付けは game_session_members 経由で辿る。game_session_id を非正規化して
 * 持つと「メモの卓」と「メンバーの卓」が二重管理になり権限判定が壊れるため持たない。
 */
export const gameSessionPlayMemos = gameSessionSchema.table(
  'game_session_play_memos',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    // unique 制約が「1メンバー1メモ」を保証し、upsert の衝突キーにもなる。
    // unique index がそのまま検索インデックスとして働くため追加のインデックスは不要。
    memberId: uuid('member_id')
      .notNull()
      .unique()
      .references(() => gameSessionMembers.id, { onDelete: 'cascade' }),
    body: text('body').notNull().default(''),
    // 公開日時。null なら非公開（design-v1.2 §4）
    sharedAt: timestamp('shared_at'),
    createdAt: timestamp('created_at').notNull().defaultNow(),
    updatedAt: timestamp('updated_at')
      .notNull()
      .defaultNow()
      .$onUpdate(() => new Date()),
  },
);

/**
 * ゲスト参加をアカウントへ紐づけるための申請（ADR 0008）。
 * 募集枠側の lobby_member_link_requests と同構造。承認・却下で行は削除される。
 */
export const gameSessionMemberLinkRequests = gameSessionSchema.table(
  'game_session_member_link_requests',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    memberId: uuid('member_id')
      .notNull()
      .references(() => gameSessionMembers.id, { onDelete: 'cascade' }),
    requestedUserId: text('requested_user_id')
      .notNull()
      .references(() => user.id, { onDelete: 'cascade' }),
    createdAt: timestamp('created_at').notNull().defaultNow(),
  },
  (table) => ({
    // ホストの申請一覧取得で member_id を辿るため
    memberIdIdx: index('game_session_member_link_requests_member_id_idx').on(
      table.memberId,
    ),
    // 同一ユーザーが同じゲスト行へ重複申請するのを防ぐ
    memberUserUnique: unique(
      'game_session_member_link_requests_member_user_unique',
    ).on(table.memberId, table.requestedUserId),
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
  ({ one, many }) => ({
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
    playMemo: one(gameSessionPlayMemos, {
      fields: [gameSessionMembers.id],
      references: [gameSessionPlayMemos.memberId],
    }),
    linkRequests: many(gameSessionMemberLinkRequests),
  }),
);

export const gameSessionPlayMemosRelations = relations(
  gameSessionPlayMemos,
  ({ one }) => ({
    member: one(gameSessionMembers, {
      fields: [gameSessionPlayMemos.memberId],
      references: [gameSessionMembers.id],
    }),
  }),
);

export const gameSessionMemberLinkRequestsRelations = relations(
  gameSessionMemberLinkRequests,
  ({ one }) => ({
    member: one(gameSessionMembers, {
      fields: [gameSessionMemberLinkRequests.memberId],
      references: [gameSessionMembers.id],
    }),
    requestedUser: one(user, {
      fields: [gameSessionMemberLinkRequests.requestedUserId],
      references: [user.id],
    }),
  }),
);
