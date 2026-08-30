import {
  date,
  index,
  pgSchema,
  text,
  timestamp,
  unique,
  uuid,
} from 'drizzle-orm/pg-core';
import { relations } from 'drizzle-orm';
import { lobbies, lobbyEntries } from '@/system/infrastructure/database/lobby-schema';

/**
 * セッション（ゲームセッション）機能用の PostgreSQL スキーマです。
 * 機能ごとにスキーマを分離する方針（ADR 0005）に基づきます。
 */
export const gameSessionSchema = pgSchema('game_session');

/**
 * セッション＝**ロビーにおける1回の開催**（design-v2 §3-7）。
 *
 * 募集の関心事（ホスト・招待トークン・公開フラグ・定員）はすべてロビーへ移した。
 * 1つのロビーが複数のセッションを持てる（2日に分ける・中止してリスケする）。
 *
 * `title` / `scenario_name` / `location` / `time_label` は**任意の上書き**で、
 * NULL ならロビーの値を表示する。既定値を DB にコピーしないため、
 * ロビーを改名すると上書きしていないセッションの表示も追随する（§5-5）。
 */
export const gameSessions = gameSessionSchema.table(
  'game_sessions',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    // 直接卓立ても必ずロビーを1つ作るため nullable にしない（design-v2 §9-3）
    lobbyId: uuid('lobby_id')
      .notNull()
      .references(() => lobbies.id, { onDelete: 'cascade' }),
    // 「この日に開くと決めた」という決定のファクト。候補日のコピーではない
    scheduledAt: date('scheduled_at').notNull(),
    /** 任意の上書き。NULL ならロビーの title */
    title: text('title'),
    /** 任意の上書き。NULL ならロビーの scenario_name */
    scenarioName: text('scenario_name'),
    /** 当日の連絡事項（VC・部屋の URL・集合情報など）。**上書きではない** */
    description: text('description'),
    /** 任意の上書き。NULL ならロビーの location */
    location: text('location'),
    /** 時間帯の自由記述。ロビー側に対応列が無いので実質は生値のみ */
    timeLabel: text('time_label'),
    completedAt: timestamp('completed_at'),
    /** 開催の中止。ロビーの disbanded_at（企画の解散）とは別概念 */
    cancelledAt: timestamp('cancelled_at'),
    createdAt: timestamp('created_at').notNull().defaultNow(),
    updatedAt: timestamp('updated_at')
      .notNull()
      .defaultNow()
      .$onUpdate(() => new Date()),
  },
  (table) => ({
    lobbyScheduledAtIdx: index('game_sessions_lobby_id_scheduled_at_idx').on(
      table.lobbyId,
      table.scheduledAt,
    ),
  }),
);

/**
 * 着席＝**ホストがその開催に誰を選んだか**という選出のファクト（design-v2 §3-8）。
 *
 * v0.2 の game_session_members の改名。user_id / guest_name は LobbyEntry 経由で
 * 解決できるため落とし、紐付けは lobby_entry_id 1本にした。
 *
 * **アプリケーション層の不変条件**: lobby_entry_id が指す LobbyEntry の lobby_id は、
 * game_session_id が指す GameSession の lobby_id と一致しなければならない。
 * 単純な FK では表現できないため use case 側で検証する（§3-8・§5-2）。
 */
export const seats = gameSessionSchema.table(
  'seats',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    gameSessionId: uuid('game_session_id')
      .notNull()
      .references(() => gameSessions.id, { onDelete: 'cascade' }),
    lobbyEntryId: uuid('lobby_entry_id')
      .notNull()
      .references(() => lobbyEntries.id, { onDelete: 'cascade' }),
    // キャラクター名は character_assignments へ切り出す予定だが（design-v2 §3-9）、
    // それはタスク6（#116）の担当。ここでは列のまま保持する
    characterName: text('character_name'),
    createdAt: timestamp('created_at').notNull().defaultNow(),
    updatedAt: timestamp('updated_at')
      .notNull()
      .defaultNow()
      .$onUpdate(() => new Date()),
  },
  (table) => ({
    // ゲストも自分の LobbyEntry を持つため、v0.2 の
    // 「WHERE user_id IS NOT NULL」という条件付き unique が不要になった
    gameSessionEntryUnique: unique(
      'seats_game_session_id_lobby_entry_id_unique',
    ).on(table.gameSessionId, table.lobbyEntryId),
    lobbyEntryIdIdx: index('seats_lobby_entry_id_idx').on(table.lobbyEntryId),
  }),
);

/**
 * プレイメモ（参加者が自分用に残す記録）。
 *
 * design-v1.2 の設計をそのまま引き継ぎ、ぶら下がり先を member_id → seat_id に付け替えた。
 * セッションの紐付けは seats 経由で辿る。game_session_id を非正規化して持つと
 * 「メモの開催」と「着席の開催」が二重管理になり権限判定が壊れるため持たない。
 */
export const gameSessionPlayMemos = gameSessionSchema.table(
  'game_session_play_memos',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    // unique 制約が「1着席1メモ」を保証し、upsert の衝突キーにもなる。
    // unique index がそのまま検索インデックスとして働くため追加のインデックスは不要。
    seatId: uuid('seat_id')
      .notNull()
      .unique()
      .references(() => seats.id, { onDelete: 'cascade' }),
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

export const gameSessionsRelations = relations(
  gameSessions,
  ({ one, many }) => ({
    lobby: one(lobbies, {
      fields: [gameSessions.lobbyId],
      references: [lobbies.id],
    }),
    seats: many(seats),
  }),
);

export const seatsRelations = relations(seats, ({ one }) => ({
  gameSession: one(gameSessions, {
    fields: [seats.gameSessionId],
    references: [gameSessions.id],
  }),
  entry: one(lobbyEntries, {
    fields: [seats.lobbyEntryId],
    references: [lobbyEntries.id],
  }),
  playMemo: one(gameSessionPlayMemos, {
    fields: [seats.id],
    references: [gameSessionPlayMemos.seatId],
  }),
}));

export const gameSessionPlayMemosRelations = relations(
  gameSessionPlayMemos,
  ({ one }) => ({
    seat: one(seats, {
      fields: [gameSessionPlayMemos.seatId],
      references: [seats.id],
    }),
  }),
);
