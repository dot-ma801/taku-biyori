import { z } from 'zod';
import { LobbyStatus } from '@/lobby/status';
import { todayDateString } from '@/date';

export { LobbyStatus };
export const LobbyStatusSchema = z.nativeEnum(LobbyStatus);

export const LobbyListItemSchema = z.object({
  id: z.string().uuid(),
  title: z.string(),
  scenarioName: z.string().nullable().optional(),
  status: LobbyStatusSchema,
  isPublished: z.boolean(),
  openUntil: z.string().nullable().optional(),
  memberCount: z.number().int(),
  maxPlayers: z.number().int().nullable().optional(),
  createdAt: z.string(),
  updatedAt: z.string(),
  role: z.enum(['host', 'member']).nullable(),
});
export type LobbyListItem = z.infer<typeof LobbyListItemSchema>;

export const LobbySchema = z.object({
  id: z.string().uuid(),
  title: z.string(),
  description: z.string().nullable().optional(),
  scenarioName: z.string().nullable().optional(),
  location: z.string().nullable().optional(),
  status: LobbyStatusSchema,
  isPublished: z.boolean(),
  maxPlayers: z.number().int().nullable().optional(),
  openUntil: z.string().nullable().optional(),
  closedAt: z.string().nullable().optional(),
  cancelledAt: z.string().nullable().optional(),
  hostUserId: z.string(),
  createdAt: z.string(),
  updatedAt: z.string(),
});
export type Lobby = z.infer<typeof LobbySchema>;

export const CreateLobbyInputSchema = z
  .object({
    title: z.string().min(1).max(100),
    description: z.string().max(1000).optional(),
    scenarioName: z.string().max(200).optional(),
    location: z.string().max(200).optional(),
    maxPlayers: z.number().int().min(2).max(20).optional(),
    openUntil: z.iso.date().optional(),
    candidateDates: z.array(z.iso.date()).min(1),
  })
  .superRefine((input, ctx) => {
    const today = todayDateString();
    if (input.openUntil && input.openUntil < today) {
      ctx.addIssue({
        code: 'custom',
        path: ['openUntil'],
        message: '募集締め切り日には今日以降の日付を指定してください',
      });
    }
    if (new Set(input.candidateDates).size !== input.candidateDates.length) {
      ctx.addIssue({
        code: 'custom',
        path: ['candidateDates'],
        message: '候補日に重複する日付を含めることはできません',
      });
    }
  });
export type CreateLobbyInput = z.infer<typeof CreateLobbyInputSchema>;

export const UpdateLobbyInputSchema = z
  .object({
    title: z.string().min(1).max(100).optional(),
    description: z.string().max(1000).nullable().optional(),
    scenarioName: z.string().max(200).nullable().optional(),
    location: z.string().max(200).nullable().optional(),
    maxPlayers: z.number().int().min(2).max(20).nullable().optional(),
    openUntil: z.iso.date().nullable().optional(),
  })
  .refine((input) => Object.keys(input).length > 0, {
    message: '少なくとも1つのフィールドが必要です',
  })
  .superRefine((input, ctx) => {
    // null（締め切りのクリア）・未指定は検証しない
    if (input.openUntil && input.openUntil < todayDateString()) {
      ctx.addIssue({
        code: 'custom',
        path: ['openUntil'],
        message: '募集締め切り日には今日以降の日付を指定してください',
      });
    }
  });
export type UpdateLobbyInput = z.infer<typeof UpdateLobbyInputSchema>;

export const UpdateLobbyStatusInputSchema = z.object({
  status: z.enum(['open', 'cancelled']),
});
export type UpdateLobbyStatusInput = z.infer<
  typeof UpdateLobbyStatusInputSchema
>;

export const LobbyMemberSchema = z.object({
  id: z.string().uuid(),
  userId: z.string().nullable(),
  userName: z.string().nullable(),
  guestName: z.string().nullable(),
  joinedAt: z.string(),
});
export type LobbyMember = z.infer<typeof LobbyMemberSchema>;

export const LobbyDetailSchema = LobbySchema.extend({
  members: z.array(LobbyMemberSchema),
});
export type LobbyDetail = z.infer<typeof LobbyDetailSchema>;

// 募集枠メンバーは character_name を持たない（design-v1.1 §6）ため、
// 参加入力は空オブジェクト。将来的にフィールドが増える可能性に備えてスキーマ自体は残す。
export const JoinLobbyInputSchema = z.object({});
export type JoinLobbyInput = z.infer<typeof JoinLobbyInputSchema>;

export const JoinLobbyAsGuestInputSchema = z.object({
  guestName: z.string().min(1).max(100),
});
export type JoinLobbyAsGuestInput = z.infer<typeof JoinLobbyAsGuestInputSchema>;

export const LobbyGuestLinkResponseSchema = z.object({
  token: z.string(),
});
export type LobbyGuestLinkResponse = z.infer<
  typeof LobbyGuestLinkResponseSchema
>;

// 日程調整（候補日・回答）。game-session の availability-dates 系と同一インターフェースだが、
// shared のエクスポート名衝突を避けるため Lobby プレフィックスを付ける（design-v1.1 §Lobby Schedules）。
export const LobbyAvailabilityDateAnswerSchema = z.object({
  id: z.string().uuid(),
  memberId: z.string().uuid(),
  answer: z.enum(['ok', 'maybe', 'ng']),
  comment: z.string().nullable().optional(),
});
export type LobbyAvailabilityDateAnswer = z.infer<
  typeof LobbyAvailabilityDateAnswerSchema
>;

export const LobbyAvailabilityDateSchema = z.object({
  id: z.string().uuid(),
  date: z.iso.date(),
  answers: z.array(LobbyAvailabilityDateAnswerSchema),
});
export type LobbyAvailabilityDate = z.infer<typeof LobbyAvailabilityDateSchema>;

export const CreateLobbyAvailabilityDateInputSchema = z
  .object({
    date: z.iso.date(),
  })
  .refine((input) => input.date >= todayDateString(), {
    message: '候補日には今日以降の日付を指定してください',
    path: ['date'],
  });
export type CreateLobbyAvailabilityDateInput = z.infer<
  typeof CreateLobbyAvailabilityDateInputSchema
>;

// game-session と異なり、置き換え後の候補日が 0 件になる更新は許可しない（design-v1.1 §Lobby Schedules）。
export const BulkUpdateLobbyAvailabilityDatesInputSchema = z.object({
  dates: z.array(z.iso.date()).min(1),
});
export type BulkUpdateLobbyAvailabilityDatesInput = z.infer<
  typeof BulkUpdateLobbyAvailabilityDatesInputSchema
>;

export const UpdateLobbyAvailabilityDateResponseInputSchema = z.object({
  answer: LobbyAvailabilityDateAnswerSchema.shape.answer,
  comment: z.string().max(500).optional(),
});
export type UpdateLobbyAvailabilityDateResponseInput = z.infer<
  typeof UpdateLobbyAvailabilityDateResponseInputSchema
>;

// ゲストの日程回答。本人確認手段がないため、どのゲスト列を更新するかを memberId で明示する。
export const GuestUpdateLobbyAvailabilityDateResponseInputSchema =
  UpdateLobbyAvailabilityDateResponseInputSchema.extend({
    memberId: z.string().uuid(),
  });
export type GuestUpdateLobbyAvailabilityDateResponseInput = z.infer<
  typeof GuestUpdateLobbyAvailabilityDateResponseInputSchema
>;
