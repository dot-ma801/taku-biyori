import { z } from 'zod';
import { LobbyStatus } from '@/lobby/status';
import { DateNoteSchema } from '@/lobby/date-note';
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

/**
 * 候補日1件分の入力。日付と、その日に添えるひとこと（自由記述）を持つ。
 * ひとことは候補日と同じ経路（作成・一括更新）で保存するため、専用の入力型は作らない。
 */
export const LobbyCandidateDateInputSchema = z.object({
  date: z.iso.date(),
  dateNote: DateNoteSchema.optional(),
});
export type LobbyCandidateDateInput = z.infer<
  typeof LobbyCandidateDateInputSchema
>;

// 候補日の件数上限。無制限だと1リクエストで大量行の INSERT/UPDATE を招けてしまうため
// （lobby-repository の bulkUpdate は1件ずつ UPDATE するので特に影響が大きい）、
// 実用上ありえない件数を弾く目的で緩めに設定する。
export const LOBBY_CANDIDATE_DATES_MAX_COUNT = 100;

export const CreateLobbyInputSchema = z
  .object({
    title: z.string().min(1).max(100),
    description: z.string().max(1000).optional(),
    scenarioName: z.string().max(200).optional(),
    location: z.string().max(200).optional(),
    maxPlayers: z.number().int().min(2).max(20).optional(),
    openUntil: z.iso.date().optional(),
    candidateDates: z
      .array(LobbyCandidateDateInputSchema)
      .min(1)
      .max(LOBBY_CANDIDATE_DATES_MAX_COUNT),
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
    const dates = input.candidateDates.map((entry) => entry.date);
    if (new Set(dates).size !== dates.length) {
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

// 卓確定（選出）。candidateId・memberIds は必須（design-v1.1 §5）。
// memberIds は 1 件以上必須（選出対象0人での確定は許可しない）。
export const ConfirmLobbyInputSchema = z.object({
  candidateId: z.string().uuid(),
  memberIds: z.array(z.string().uuid()).min(1),
});
export type ConfirmLobbyInput = z.infer<typeof ConfirmLobbyInputSchema>;

export const LobbyMemberSchema = z.object({
  id: z.string().uuid(),
  userId: z.string().nullable(),
  userName: z.string().nullable(),
  guestName: z.string().nullable(),
  joinedAt: z.string(),
});
export type LobbyMember = z.infer<typeof LobbyMemberSchema>;

export const ConfirmedGameSessionSchema = z.object({
  id: z.string().uuid(),
  selectedLobbyMemberIds: z.array(z.string().uuid()),
});
export type ConfirmedGameSession = z.infer<typeof ConfirmedGameSessionSchema>;

export const LobbyDetailSchema = LobbySchema.extend({
  members: z.array(LobbyMemberSchema),
  confirmedGameSession: ConfirmedGameSessionSchema.nullable().optional(),
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
  /** ホストがこの候補日に添えたひとこと（「13:00〜17:00」「午後から」など）。未入力は null */
  dateNote: z.string().nullable(),
  answers: z.array(LobbyAvailabilityDateAnswerSchema),
});
export type LobbyAvailabilityDate = z.infer<typeof LobbyAvailabilityDateSchema>;

export const CreateLobbyAvailabilityDateInputSchema =
  LobbyCandidateDateInputSchema.refine(
    (input) => input.date >= todayDateString(),
    {
      message: '候補日には今日以降の日付を指定してください',
      path: ['date'],
    },
  );
export type CreateLobbyAvailabilityDateInput = z.infer<
  typeof CreateLobbyAvailabilityDateInputSchema
>;

// game-session と異なり、置き換え後の候補日が 0 件になる更新は許可しない（design-v1.1 §Lobby Schedules）。
export const BulkUpdateLobbyAvailabilityDatesInputSchema = z
  .object({
    dates: z
      .array(LobbyCandidateDateInputSchema)
      .min(1)
      .max(LOBBY_CANDIDATE_DATES_MAX_COUNT),
  })
  .superRefine((input, ctx) => {
    const dates = input.dates.map((entry) => entry.date);
    if (new Set(dates).size !== dates.length) {
      ctx.addIssue({
        code: 'custom',
        path: ['dates'],
        message: '候補日に重複する日付を含めることはできません',
      });
    }
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
