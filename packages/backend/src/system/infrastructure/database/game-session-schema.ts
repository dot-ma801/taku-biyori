import { date, index, pgSchema, text, timestamp, unique, uuid } from 'drizzle-orm/pg-core';
import { relations } from 'drizzle-orm';
import { lobbies, lobbyEntries } from '@/system/infrastructure/database/lobby-schema';

export const gameSessionSchema = pgSchema('game_session');

export const gameSessions = gameSessionSchema.table('game_sessions', {
  id: uuid('id').primaryKey().defaultRandom(),
  lobbyId: uuid('lobby_id').notNull().references(() => lobbies.id, { onDelete: 'cascade' }),
  scheduledAt: date('scheduled_at').notNull(),
  title: text('title'),
  scenarioName: text('scenario_name'),
  description: text('description'),
  location: text('location'),
  timeLabel: text('time_label'),
  completedAt: timestamp('completed_at'),
  cancelledAt: timestamp('cancelled_at'),
  createdAt: timestamp('created_at').notNull().defaultNow(),
  updatedAt: timestamp('updated_at').notNull().defaultNow().$onUpdate(() => new Date()),
}, (table) => ({
  lobbyScheduledAtIdx: index('game_sessions_lobby_id_scheduled_at_idx').on(table.lobbyId, table.scheduledAt),
}));

export const seats = gameSessionSchema.table('seats', {
  id: uuid('id').primaryKey().defaultRandom(),
  gameSessionId: uuid('game_session_id').notNull().references(() => gameSessions.id, { onDelete: 'cascade' }),
  lobbyEntryId: uuid('lobby_entry_id').notNull().references(() => lobbyEntries.id, { onDelete: 'cascade' }),
  createdAt: timestamp('created_at').notNull().defaultNow(),
  updatedAt: timestamp('updated_at').notNull().defaultNow().$onUpdate(() => new Date()),
}, (table) => ({
  gameSessionEntryUnique: unique('seats_game_session_id_lobby_entry_id_unique').on(table.gameSessionId, table.lobbyEntryId),
  lobbyEntryIdIdx: index('seats_lobby_entry_id_idx').on(table.lobbyEntryId),
}));

export const characterAssignments = gameSessionSchema.table('character_assignments', {
  id: uuid('id').primaryKey().defaultRandom(),
  seatId: uuid('seat_id').notNull().unique().references(() => seats.id, { onDelete: 'cascade' }),
  characterName: text('character_name').notNull(),
  createdAt: timestamp('created_at').notNull().defaultNow(),
  updatedAt: timestamp('updated_at').notNull().defaultNow().$onUpdate(() => new Date()),
});

export const playMemos = gameSessionSchema.table('play_memos', {
  id: uuid('id').primaryKey().defaultRandom(),
  seatId: uuid('seat_id').notNull().unique().references(() => seats.id, { onDelete: 'cascade' }),
  body: text('body').notNull().default(''),
  sharedAt: timestamp('shared_at'),
  createdAt: timestamp('created_at').notNull().defaultNow(),
  updatedAt: timestamp('updated_at').notNull().defaultNow().$onUpdate(() => new Date()),
});

export const gameSessionsRelations = relations(gameSessions, ({ one, many }) => ({
  lobby: one(lobbies, { fields: [gameSessions.lobbyId], references: [lobbies.id] }),
  seats: many(seats),
}));

export const seatsRelations = relations(seats, ({ one }) => ({
  gameSession: one(gameSessions, { fields: [seats.gameSessionId], references: [gameSessions.id] }),
  entry: one(lobbyEntries, { fields: [seats.lobbyEntryId], references: [lobbyEntries.id] }),
  playMemo: one(playMemos, { fields: [seats.id], references: [playMemos.seatId] }),
  characterAssignment: one(characterAssignments, { fields: [seats.id], references: [characterAssignments.seatId] }),
}));

export const playMemosRelations = relations(playMemos, ({ one }) => ({
  seat: one(seats, { fields: [playMemos.seatId], references: [seats.id] }),
}));
