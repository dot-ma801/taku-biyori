import { z } from 'zod';

export const GameSessionStatusSchema = z.enum([
  'draft',
  'open',
  'scheduling',
  'confirmed',
  'today',
  'completed',
]);
export type GameSessionStatus = z.infer<typeof GameSessionStatusSchema>;

export const GameSessionListItemSchema = z.object({
  id: z.string().uuid(),
  title: z.string(),
  scenarioName: z.string().nullable().optional(),
  status: GameSessionStatusSchema,
  isPublished: z.boolean(),
  openUntil: z.string().nullable().optional(),
  memberCount: z.number().int(),
  scheduledAt: z.string().nullable().optional(),
  createdAt: z.string(),
  updatedAt: z.string(),
});
export type GameSessionListItem = z.infer<typeof GameSessionListItemSchema>;

export const GameSessionSchema = z.object({
  id: z.string().uuid(),
  title: z.string(),
  description: z.string().nullable().optional(),
  scenarioName: z.string().nullable().optional(),
  status: GameSessionStatusSchema,
  isPublished: z.boolean(),
  openUntil: z.string().nullable().optional(),
  scheduledAt: z.string().nullable().optional(),
  completedAt: z.string().nullable().optional(),
  maxMembers: z.number().int().nullable().optional(),
  createdBy: z.string(),
  createdAt: z.string(),
  updatedAt: z.string(),
});
export type GameSession = z.infer<typeof GameSessionSchema>;

export const CreateGameSessionInputSchema = z.object({
  title: z.string().min(1).max(100),
  description: z.string().max(1000).optional(),
  scenarioName: z.string().max(200).optional(),
  maxMembers: z.number().int().min(2).max(20).optional(),
  openUntil: z.iso.date().optional(),
});
export type CreateGameSessionInput = z.infer<typeof CreateGameSessionInputSchema>;
