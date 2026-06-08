import {
  boolean,
  date,
  index,
  integer,
  pgEnum,
  pgTable,
  text,
  timestamp,
  unique,
  uuid,
} from 'drizzle-orm/pg-core';
import { relations } from 'drizzle-orm';
import { user } from '@/system/infrastructure/database/schema';

export const gameSessions = pgTable('game_sessions', {
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
  createdAt: timestamp('created_at').notNull().defaultNow(),
  updatedAt: timestamp('updated_at')
    .notNull()
    .defaultNow()
    .$onUpdate(() => new Date()),
});

export const gameSessionMembers = pgTable('game_session_members', {
  id: uuid('id').primaryKey().defaultRandom(),
  gameSessionId: uuid('game_session_id')
    .notNull()
    .references(() => gameSessions.id, { onDelete: 'cascade' }),
  userId: text('user_id').references(() => user.id),
  guestName: text('guest_name'),
  characterName: text('character_name'),
  createdAt: timestamp('created_at').notNull().defaultNow(),
  updatedAt: timestamp('updated_at')
    .notNull()
    .defaultNow()
    .$onUpdate(() => new Date()),
});

export const gameSessionCandidates = pgTable(
  'game_session_candidates',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    gameSessionId: uuid('game_session_id')
      .notNull()
      .references(() => gameSessions.id, { onDelete: 'cascade' }),
    date: date('date').notNull(),
    createdAt: timestamp('created_at').notNull().defaultNow(),
    updatedAt: timestamp('updated_at')
      .notNull()
      .defaultNow()
      .$onUpdate(() => new Date()),
  },
  (table) => ({
    gameSessionIdIdx: index('game_session_candidates_game_session_id_idx').on(
      table.gameSessionId,
    ),
  }),
);

export const availabilityDateAnswerEnum = pgEnum('availability_date_answer', [
  'ok',
  'maybe',
  'ng',
]);

export const gameSessionAnswers = pgTable(
  'game_session_answers',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    candidateId: uuid('candidate_id')
      .notNull()
      .references(() => gameSessionCandidates.id, { onDelete: 'cascade' }),
    memberId: uuid('member_id')
      .notNull()
      .references(() => gameSessionMembers.id, { onDelete: 'cascade' }),
    answer: availabilityDateAnswerEnum('answer').notNull(),
    comment: text('comment'),
    createdAt: timestamp('created_at').notNull().defaultNow(),
    updatedAt: timestamp('updated_at')
      .notNull()
      .defaultNow()
      .$onUpdate(() => new Date()),
  },
  (table) => ({
    candidateIdIdx: index('game_session_answers_candidate_id_idx').on(
      table.candidateId,
    ),
    memberIdIdx: index('game_session_answers_member_id_idx').on(table.memberId),
    candidateMemberUnique: unique(
      'game_session_answers_candidate_member_unique',
    ).on(table.candidateId, table.memberId),
  }),
);

export const gameSessionsRelations = relations(
  gameSessions,
  ({ one, many }) => ({
    host: one(user, {
      fields: [gameSessions.hostUserId],
      references: [user.id],
    }),
    members: many(gameSessionMembers),
    candidates: many(gameSessionCandidates),
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
    answers: many(gameSessionAnswers),
  }),
);

export const gameSessionCandidatesRelations = relations(
  gameSessionCandidates,
  ({ one, many }) => ({
    gameSession: one(gameSessions, {
      fields: [gameSessionCandidates.gameSessionId],
      references: [gameSessions.id],
    }),
    answers: many(gameSessionAnswers),
  }),
);

export const gameSessionAnswersRelations = relations(
  gameSessionAnswers,
  ({ one }) => ({
    candidate: one(gameSessionCandidates, {
      fields: [gameSessionAnswers.candidateId],
      references: [gameSessionCandidates.id],
    }),
    member: one(gameSessionMembers, {
      fields: [gameSessionAnswers.memberId],
      references: [gameSessionMembers.id],
    }),
  }),
);
