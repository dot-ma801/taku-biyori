import {
  date,
  index,
  pgSchema,
  text,
  timestamp,
  unique,
  uniqueIndex,
  uuid,
  integer,
} from 'drizzle-orm/pg-core';
import { relations, sql } from 'drizzle-orm';
import { user } from '@/system/infrastructure/database/schema';

/**
 * 募集枠（lobby）機能用の PostgreSQL スキーマです。
 * 機能ごとにスキーマを分離する方針（ADR 0005）に基づきます。
 */
export const lobbySchema = pgSchema('lobby');

export const lobbies = lobbySchema.table('lobbies', {
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
  // 下書きを抜けて動き出した時点。NULL なら下書き（design-v2 §3-2）。
  // boolean の is_published から変更した。他のファクト列と形を揃え、
  // 「全ユーザーに公開」という別軸を後から足せるようにするため
  publishedAt: timestamp('published_at'),
  // 受付締め切り日。NULL は無期限受付
  openUntil: date('open_until'),
  // ホストが受付を手動で閉じた時点。追加募集で NULL に戻す。
  // open_until（締め切り日を決めた）とは別の出来事なので列を分けている（design-v2 §3-2）
  receptionClosedAt: timestamp('reception_closed_at'),
  // 企画そのものの解散。cancelled_at の改名（design-v2 §1-2）
  disbandedAt: timestamp('disbanded_at'),
  createdAt: timestamp('created_at').notNull().defaultNow(),
  updatedAt: timestamp('updated_at')
    .notNull()
    .defaultNow()
    .$onUpdate(() => new Date()),
});

export const lobbyEntries = lobbySchema.table(
  'lobby_entries',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    lobbyId: uuid('lobby_id')
      .notNull()
      .references(() => lobbies.id, { onDelete: 'cascade' }),
    userId: text('user_id').references(() => user.id),
    guestName: text('guest_name'),
    // 脱退。**行は削除しない**（Seat・回答・メモが参照しているため。design-v2 §9-5）
    leftAt: timestamp('left_at'),
    createdAt: timestamp('created_at').notNull().defaultNow(),
    updatedAt: timestamp('updated_at')
      .notNull()
      .defaultNow()
      .$onUpdate(() => new Date()),
  },
  (table) => ({
    // ログインユーザーの重複参加を防ぐ partial unique index（user_id が NULL のゲストは対象外）。
    // left_at は条件に含めない。再参加は新しい行を作らず left_at を NULL に戻すため
    userUniqueIdx: uniqueIndex('lobby_entries_lobby_id_user_id_unique')
      .on(table.lobbyId, table.userId)
      .where(sql`${table.userId} IS NOT NULL`),
  }),
);

/**
 * 日程調整（design-v2 §3-4）。ロビー直下にぶら下がっていた候補日を、
 * **繰り返せる独立ユニット**に昇格させたもの。リスケのたびに1行増え、古い行は消さない。
 *
 * 終了ファクト（closed_at）は持たない。「最新の調整」は行の並び順で決める（§9-9）。
 */
export const schedulePolls = lobbySchema.table(
  'schedule_polls',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    lobbyId: uuid('lobby_id')
      .notNull()
      .references(() => lobbies.id, { onDelete: 'cascade' }),
    // 既定値だけ他テーブル（now() = トランザクション開始時刻）と違う。
    // now() は同一トランザクション内で完全に同値になり、uuid v4 の id は
    // タイブレークにならないため「最新の調整」が不定になる（design-v2 §3-4）。
    // clock_timestamp() は実時刻を返すので同一トランザクション内でも衝突しない
    createdAt: timestamp('created_at')
      .notNull()
      .default(sql`clock_timestamp()`),
    updatedAt: timestamp('updated_at')
      .notNull()
      .defaultNow()
      .$onUpdate(() => new Date()),
  },
  (table) => ({
    // 最新の調整を ORDER BY created_at DESC LIMIT 1 で取るための index
    lobbyCreatedAtIdx: index('schedule_polls_lobby_id_created_at_idx').on(
      table.lobbyId,
      table.createdAt.desc(),
    ),
  }),
);

/** 候補日（design-v2 §3-5）。lobby_candidates の改名（lobby_id → poll_id、date_note → time_label） */
export const candidateDates = lobbySchema.table(
  'candidate_dates',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    pollId: uuid('poll_id')
      .notNull()
      .references(() => schedulePolls.id, { onDelete: 'cascade' }),
    date: date('date').notNull(),
    // 時間帯の自由記述（「午後」「〜15時」など）。時刻を構造化しない理由は
    // shared の time-label.ts を参照。v0.2 の date_note の改名
    timeLabel: text('time_label'),
    createdAt: timestamp('created_at').notNull().defaultNow(),
    updatedAt: timestamp('updated_at')
      .notNull()
      .defaultNow()
      .$onUpdate(() => new Date()),
  },
  (table) => ({
    pollIdIdx: index('candidate_dates_poll_id_idx').on(table.pollId),
    // 同じ調整に同じ日付を重複登録できないようにする。
    // ロビー単位ではなく調整単位なので、やり直した調整には同じ日付を挙げ直せる
    pollDateUnique: unique('candidate_dates_poll_id_date_unique').on(
      table.pollId,
      table.date,
    ),
  }),
);

export const scheduleAnswerEnum = lobbySchema.enum('schedule_answer', [
  'ok',
  'maybe',
  'ng',
]);

/** 候補日への◯△×（design-v2 §3-6）。lobby_answers の改名 */
export const scheduleAnswers = lobbySchema.table(
  'schedule_answers',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    candidateDateId: uuid('candidate_date_id')
      .notNull()
      .references(() => candidateDates.id, { onDelete: 'cascade' }),
    lobbyEntryId: uuid('lobby_entry_id')
      .notNull()
      .references(() => lobbyEntries.id, { onDelete: 'cascade' }),
    answer: scheduleAnswerEnum('answer').notNull(),
    comment: text('comment'),
    createdAt: timestamp('created_at').notNull().defaultNow(),
    updatedAt: timestamp('updated_at')
      .notNull()
      .defaultNow()
      .$onUpdate(() => new Date()),
  },
  (table) => ({
    candidateDateIdIdx: index('schedule_answers_candidate_date_id_idx').on(
      table.candidateDateId,
    ),
    lobbyEntryIdIdx: index('schedule_answers_lobby_entry_id_idx').on(
      table.lobbyEntryId,
    ),
    candidateDateEntryUnique: unique(
      'schedule_answers_candidate_date_entry_unique',
    ).on(table.candidateDateId, table.lobbyEntryId),
  }),
);

export const lobbiesRelations = relations(lobbies, ({ one, many }) => ({
  host: one(user, {
    fields: [lobbies.hostUserId],
    references: [user.id],
  }),
  entries: many(lobbyEntries),
  schedulePolls: many(schedulePolls),
}));

export const lobbyEntriesRelations = relations(
  lobbyEntries,
  ({ one, many }) => ({
    lobby: one(lobbies, {
      fields: [lobbyEntries.lobbyId],
      references: [lobbies.id],
    }),
    user: one(user, {
      fields: [lobbyEntries.userId],
      references: [user.id],
    }),
    answers: many(scheduleAnswers),
  }),
);

export const schedulePollsRelations = relations(
  schedulePolls,
  ({ one, many }) => ({
    lobby: one(lobbies, {
      fields: [schedulePolls.lobbyId],
      references: [lobbies.id],
    }),
    candidateDates: many(candidateDates),
  }),
);

export const candidateDatesRelations = relations(
  candidateDates,
  ({ one, many }) => ({
    poll: one(schedulePolls, {
      fields: [candidateDates.pollId],
      references: [schedulePolls.id],
    }),
    answers: many(scheduleAnswers),
  }),
);

export const scheduleAnswersRelations = relations(
  scheduleAnswers,
  ({ one }) => ({
    candidateDate: one(candidateDates, {
      fields: [scheduleAnswers.candidateDateId],
      references: [candidateDates.id],
    }),
    entry: one(lobbyEntries, {
      fields: [scheduleAnswers.lobbyEntryId],
      references: [lobbyEntries.id],
    }),
  }),
);
