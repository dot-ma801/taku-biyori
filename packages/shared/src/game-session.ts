import { z } from 'zod';
import { GameSessionStatus } from '@/game-session/status';
import { todayDateString } from '@/date';

export { GameSessionStatus };
export const GameSessionStatusSchema = z.nativeEnum(GameSessionStatus);

export const GameSessionListItemSchema = z.object({
  id: z.string().uuid(),
  title: z.string(),
  scenarioName: z.string().nullable().optional(),
  status: GameSessionStatusSchema,
  isPublished: z.boolean(),
  memberCount: z.number().int(),
  maxMembers: z.number().int().nullable().optional(),
  scheduledAt: z.string().nullable().optional(),
  createdAt: z.string(),
  updatedAt: z.string(),
  role: z.enum(['host', 'member']).nullable(),
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
  scheduledAt: z.string().nullable().optional(),
  completedAt: z.string().nullable().optional(),
  cancelledAt: z.string().nullable().optional(),
  maxMembers: z.number().int().nullable().optional(),
  // 出自の募集枠。直接卓立ては null（design-v1.1 §6）
  lobbyId: z.string().uuid().nullable().optional(),
  createdBy: z.string(),
  createdAt: z.string(),
  updatedAt: z.string(),
});
export type GameSession = z.infer<typeof GameSessionSchema>;

// 卓は日程が確定した状態でのみ存在するため scheduledAt は必須（design-v1.1 §8）。
// 募集締め切り（openUntil）は募集枠（lobby）の関心事なので卓では受け付けない。
export const CreateGameSessionInputSchema = z
  .object({
    title: z.string().min(1).max(100),
    description: z.string().max(1000).optional(),
    scenarioName: z.string().max(200).optional(),
    location: z.string().max(200).optional(),
    maxMembers: z.number().int().min(2).max(20).optional(),
    scheduledAt: z.iso.date(),
  })
  .superRefine((input, ctx) => {
    if (input.scheduledAt < todayDateString()) {
      ctx.addIssue({
        code: 'custom',
        path: ['scheduledAt'],
        message: '開催日には今日以降の日付を指定してください',
      });
    }
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
    scheduledAt: z.iso.date().nullable().optional(),
  })
  .refine((input) => Object.keys(input).length > 0, {
    message: '少なくとも1つのフィールドが必要です',
  });
export type UpdateGameSessionInput = z.infer<
  typeof UpdateGameSessionInputSchema
>;

export const UpdateGameSessionStatusInputSchema = z.object({
  status: z.enum(['open', 'completed', 'cancelled']),
});
export type UpdateGameSessionStatusInput = z.infer<
  typeof UpdateGameSessionStatusInputSchema
>;

export const GameSessionMemberSchema = z.object({
  id: z.string().uuid(),
  userId: z.string().nullable(),
  userName: z.string().nullable(),
  guestName: z.string().nullable(),
  characterName: z.string().nullable(),
  // 卓確定でコピーされたメンバーの出自（募集枠メンバーID）。直接参加は null（design-v1.1 §3）
  lobbyMemberId: z.string().uuid().nullable().optional(),
  joinedAt: z.string(),
});
export type GameSessionMember = z.infer<typeof GameSessionMemberSchema>;

export const GameSessionDetailSchema = GameSessionSchema.extend({
  members: z.array(GameSessionMemberSchema),
});
export type GameSessionDetail = z.infer<typeof GameSessionDetailSchema>;

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
 * X- prefix は RFC 6648 で非推奨のため使用しない。
 */
export const GUEST_TOKEN_HEADER = 'Guest-Token';
