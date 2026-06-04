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
export type CreateGameSessionInput = z.infer<
  typeof CreateGameSessionInputSchema
>;

export const UpdateGameSessionInputSchema = z
  .object({
    title: z.string().min(1).max(100).optional(),
    description: z.string().max(1000).nullable().optional(),
    scenarioName: z.string().max(200).nullable().optional(),
    maxMembers: z.number().int().min(2).max(20).nullable().optional(),
    openUntil: z.iso.date().nullable().optional(),
  })
  .refine((input) => Object.keys(input).length > 0, {
    message: '少なくとも1つのフィールドが必要です',
  });
export type UpdateGameSessionInput = z.infer<
  typeof UpdateGameSessionInputSchema
>;

export const UpdateGameSessionStatusInputSchema = z.object({
  status: z.enum(['open', 'completed']),
});
export type UpdateGameSessionStatusInput = z.infer<
  typeof UpdateGameSessionStatusInputSchema
>;

export const GameSessionMemberSchema = z.object({
  id: z.string().uuid(),
  userId: z.string().nullable(),
  guestName: z.string().nullable(),
  characterName: z.string().nullable(),
  joinedAt: z.string(),
});
export type GameSessionMember = z.infer<typeof GameSessionMemberSchema>;

export const GameSessionDetailSchema = GameSessionSchema.extend({
  members: z.array(GameSessionMemberSchema),
});
export type GameSessionDetail = z.infer<typeof GameSessionDetailSchema>;
