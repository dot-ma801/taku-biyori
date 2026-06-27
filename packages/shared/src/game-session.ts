import { z } from 'zod';
import { GameSessionStatus } from '@/game-session/status';

export { GameSessionStatus };
export const GameSessionStatusSchema = z.nativeEnum(GameSessionStatus);

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
  location: z.string().nullable().optional(),
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
  location: z.string().max(200).optional(),
  maxMembers: z.number().int().min(2).max(20).optional(),
  openUntil: z.iso.date().optional(),
  scheduledAt: z.iso.date().optional(),
});
export type CreateGameSessionInput = z.infer<
  typeof CreateGameSessionInputSchema
>;

export const UpdateGameSessionInputSchema = z
  .object({
    title: z.string().min(1).max(100).optional(),
    description: z.string().max(1000).nullable().optional(),
    scenarioName: z.string().max(200).nullable().optional(),
    location: z.string().max(200).nullable().optional(),
    maxMembers: z.number().int().min(2).max(20).nullable().optional(),
    openUntil: z.iso.date().nullable().optional(),
    scheduledAt: z.iso.date().nullable().optional(),
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

export const AvailabilityDateAnswerSchema = z.object({
  id: z.string().uuid(),
  memberId: z.string().uuid(),
  answer: z.enum(['ok', 'maybe', 'ng']),
  comment: z.string().nullable().optional(),
});
export type AvailabilityDateAnswer = z.infer<
  typeof AvailabilityDateAnswerSchema
>;

export const AvailabilityDateSchema = z.object({
  id: z.string().uuid(),
  date: z.iso.date(),
  answers: z.array(AvailabilityDateAnswerSchema),
});
export type AvailabilityDate = z.infer<typeof AvailabilityDateSchema>;

export const CreateAvailabilityDateInputSchema = z.object({
  date: z.iso.date(),
});
export type CreateAvailabilityDateInput = z.infer<
  typeof CreateAvailabilityDateInputSchema
>;

export const BulkUpdateAvailabilityDatesInputSchema = z.object({
  dates: z.array(z.iso.date()),
});
export type BulkUpdateAvailabilityDatesInput = z.infer<
  typeof BulkUpdateAvailabilityDatesInputSchema
>;

export const GameSessionMemberSchema = z.object({
  id: z.string().uuid(),
  userId: z.string().nullable(),
  userName: z.string().nullable(),
  guestName: z.string().nullable(),
  characterName: z.string().nullable(),
  joinedAt: z.string(),
});
export type GameSessionMember = z.infer<typeof GameSessionMemberSchema>;

export const GameSessionDetailSchema = GameSessionSchema.extend({
  members: z.array(GameSessionMemberSchema),
});
export type GameSessionDetail = z.infer<typeof GameSessionDetailSchema>;

export const UpdateAvailabilityDateResponseInputSchema = z.object({
  answer: z.enum(['ok', 'maybe', 'ng']),
  comment: z.string().max(500).optional(),
});
export type UpdateAvailabilityDateResponseInput = z.infer<
  typeof UpdateAvailabilityDateResponseInputSchema
>;

// ゲストの日程回答。本人確認手段がないため、どのゲスト列を更新するかを memberId で明示する。
export const GuestUpdateAvailabilityDateResponseInputSchema =
  UpdateAvailabilityDateResponseInputSchema.extend({
    memberId: z.string().uuid(),
  });
export type GuestUpdateAvailabilityDateResponseInput = z.infer<
  typeof GuestUpdateAvailabilityDateResponseInputSchema
>;

export const JoinGameSessionInputSchema = z.object({
  characterName: z.string().max(100).optional(),
});
export type JoinGameSessionInput = z.infer<typeof JoinGameSessionInputSchema>;

export const JoinAsGuestInputSchema = z.object({
  guestName: z.string().min(1).max(100),
});
export type JoinAsGuestInput = z.infer<typeof JoinAsGuestInputSchema>;

export const UpdateMemberInputSchema = z
  .object({
    characterName: z.string().max(100).nullable().optional(),
  })
  .refine((input) => Object.keys(input).length > 0, {
    message: '少なくとも1つのフィールドが必要です',
  });
export type UpdateMemberInput = z.infer<typeof UpdateMemberInputSchema>;

export const GuestLinkResponseSchema = z.object({
  token: z.string(),
});
export type GuestLinkResponse = z.infer<typeof GuestLinkResponseSchema>;

/**
 * ゲストの参加・回答を認可するトークンを送るヘッダー名。
 * トークンは capability（資格情報）として扱い、クエリやボディではなくこのヘッダーで送る。
 */
export const GUEST_TOKEN_HEADER = 'X-Guest-Token';
