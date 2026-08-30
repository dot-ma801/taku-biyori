import {
  boolean,
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
  isPublished: boolean('is_published').notNull().default(false),
  openUntil: date('open_until'),
  cancelledAt: timestamp('cancelled_at'),
  createdAt: timestamp('created_at').notNull().defaultNow(),
  updatedAt: timestamp('updated_at')
    .notNull()
    .defaultNow()
    .$onUpdate(() => new Date()),
});

export const lobbyMembers = lobbySchema.table(
  'lobby_members',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    lobbyId: uuid('lobby_id')
      .notNull()
      .references(() => lobbies.id, { onDelete: 'cascade' }),
    userId: text('user_id').references(() => user.id),
    guestName: text('guest_name'),
    createdAt: timestamp('created_at').notNull().defaultNow(),
    updatedAt: timestamp('updated_at')
      .notNull()
      .defaultNow()
      .$onUpdate(() => new Date()),
  },
  (table) => ({
    // ログインユーザーの重複参加を防ぐ partial unique index（user_id が NULL のゲストは対象外）
    userUniqueIdx: uniqueIndex('lobby_members_lobby_id_user_id_unique')
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
      .references(() => lobbyMembers.id, { onDelete: 'cascade' }),
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
  members: many(lobbyMembers),
  candidates: many(lobbyCandidates),
}));

export const lobbyMembersRelations = relations(
  lobbyMembers,
  ({ one, many }) => ({
    lobby: one(lobbies, {
      fields: [lobbyMembers.lobbyId],
      references: [lobbies.id],
    }),
    user: one(user, {
      fields: [lobbyMembers.userId],
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
  member: one(lobbyMembers, {
    fields: [lobbyAnswers.memberId],
    references: [lobbyMembers.id],
  }),
}));
