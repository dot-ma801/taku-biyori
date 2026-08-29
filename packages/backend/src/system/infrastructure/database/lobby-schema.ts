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

export const lobbyCandidates = lobbySchema.table(
  'lobby_candidates',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    lobbyId: uuid('lobby_id')
      .notNull()
      .references(() => lobbies.id, { onDelete: 'cascade' }),
    date: date('date').notNull(),
    // ホストがこの候補日に添えるひとこと（「13:00〜17:00」「午後から」など）。
    // 時刻を構造化せず自由記述にしている理由は shared の date-note.ts を参照。
    dateNote: text('date_note'),
    createdAt: timestamp('created_at').notNull().defaultNow(),
    updatedAt: timestamp('updated_at')
      .notNull()
      .defaultNow()
      .$onUpdate(() => new Date()),
  },
  (table) => ({
    lobbyIdIdx: index('lobby_candidates_lobby_id_idx').on(table.lobbyId),
    // 同一募集枠に同じ候補日を重複登録できないようにする
    lobbyDateUnique: unique('lobby_candidates_lobby_id_date_unique').on(
      table.lobbyId,
      table.date,
    ),
  }),
);

export const lobbyAnswerEnum = lobbySchema.enum('lobby_answer', [
  'ok',
  'maybe',
  'ng',
]);

export const lobbyAnswers = lobbySchema.table(
  'lobby_answers',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    candidateId: uuid('candidate_id')
      .notNull()
      .references(() => lobbyCandidates.id, { onDelete: 'cascade' }),
    memberId: uuid('member_id')
      .notNull()
      .references(() => lobbyEntries.id, { onDelete: 'cascade' }),
    answer: lobbyAnswerEnum('answer').notNull(),
    comment: text('comment'),
    createdAt: timestamp('created_at').notNull().defaultNow(),
    updatedAt: timestamp('updated_at')
      .notNull()
      .defaultNow()
      .$onUpdate(() => new Date()),
  },
  (table) => ({
    candidateIdIdx: index('lobby_answers_candidate_id_idx').on(
      table.candidateId,
    ),
    memberIdIdx: index('lobby_answers_member_id_idx').on(table.memberId),
    candidateMemberUnique: unique('lobby_answers_candidate_member_unique').on(
      table.candidateId,
      table.memberId,
    ),
  }),
);

export const lobbiesRelations = relations(lobbies, ({ one, many }) => ({
  host: one(user, {
    fields: [lobbies.hostUserId],
    references: [user.id],
  }),
  entries: many(lobbyEntries),
  candidates: many(lobbyCandidates),
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
    answers: many(lobbyAnswers),
  }),
);

export const lobbyCandidatesRelations = relations(
  lobbyCandidates,
  ({ one, many }) => ({
    lobby: one(lobbies, {
      fields: [lobbyCandidates.lobbyId],
      references: [lobbies.id],
    }),
    answers: many(lobbyAnswers),
  }),
);

export const lobbyAnswersRelations = relations(lobbyAnswers, ({ one }) => ({
  candidate: one(lobbyCandidates, {
    fields: [lobbyAnswers.candidateId],
    references: [lobbyCandidates.id],
  }),
  entry: one(lobbyEntries, {
    fields: [lobbyAnswers.memberId],
    references: [lobbyEntries.id],
  }),
}));
