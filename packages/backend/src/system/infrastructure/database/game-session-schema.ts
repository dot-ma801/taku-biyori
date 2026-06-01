import {
  boolean,
  date,
  integer,
  pgTable,
  text,
  timestamp,
  uuid,
} from 'drizzle-orm/pg-core';
import { relations } from 'drizzle-orm';
import { user } from './schema';

export const gameSessions = pgTable('game_sessions', {
  id: uuid('id').primaryKey().defaultRandom(),
  hostUserId: text('host_user_id')
    .notNull()
    .references(() => user.id),
  title: text('title').notNull(),
  scenarioName: text('scenario_name'),
  description: text('description'),
  maxPlayers: integer('max_players'),
  guestLinkToken: text('guest_link_token').notNull(),
  isPublished: boolean('is_published').notNull().default(false),
  openUntil: date('open_until'),
  scheduledAt: date('scheduled_at'),
  completedAt: timestamp('completed_at'),
  createdAt: timestamp('created_at').notNull().defaultNow(),
  updatedAt: timestamp('updated_at').notNull().defaultNow(),
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
  updatedAt: timestamp('updated_at').notNull().defaultNow(),
});

export const gameSessionsRelations = relations(gameSessions, ({ one, many }) => ({
  host: one(user, {
    fields: [gameSessions.hostUserId],
    references: [user.id],
  }),
  members: many(gameSessionMembers),
}));

export const gameSessionMembersRelations = relations(gameSessionMembers, ({ one }) => ({
  gameSession: one(gameSessions, {
    fields: [gameSessionMembers.gameSessionId],
    references: [gameSessions.id],
  }),
  user: one(user, {
    fields: [gameSessionMembers.userId],
    references: [user.id],
  }),
}));
