import { z } from 'zod';
import { LobbyStatus } from '@/lobby/status';
import { DateNoteSchema } from '@/lobby/date-note';
import { TimeLabelSchema } from '@/lobby/time-label';
import { todayDateString } from '@/date';

export { LobbyStatus };
export const LobbyStatusSchema = z.nativeEnum(LobbyStatus);

/**
 * ロビーへの参加（lobby.lobby_entries）。v0.2 の `LobbyMember` の改名（design-v2 §3-3）。
 *
 * - ログインユーザー: `userId` が非 null、`guestName` は null
 * - ゲスト: `userId` が null、`guestName` が非 null
 *
 * **脱退しても行は消えない。** `leftAt` に時刻が入るだけで、過去の着席・回答・メモは
 * 繋がったまま残る（design-v2 §9-5）。再参加は新しい行を作らず `leftAt` を null に戻す。
 *
 * キャラクター名は着席してからの関心事のため、LobbyEntry は `characterName` を持たない。
 */
export const LobbyEntrySchema = z.object({
  id: z.string().uuid(),
  userId: z.string().nullable(),
  userName: z.string().nullable(),
  guestName: z.string().nullable(),
  joinedAt: z.string(),
  /** 脱退日時。null なら在籍中 */
  leftAt: z.string().nullable(),
});
export type LobbyEntry = z.infer<typeof LobbyEntrySchema>;

export const LobbyListItemSchema = z.object({
  id: z.string().uuid(),
  title: z.string(),
  scenarioName: z.string().nullable().optional(),
  status: LobbyStatusSchema,
  /** 下書きを抜けて動き出した時点。null なら draft */
  publishedAt: z.string().nullable(),
  openUntil: z.string().nullable().optional(),
  /** ホストが受付を手動で閉じた時点。追加募集で null に戻る */
  receptionClosedAt: z.string().nullable(),
  maxPlayers: z.number().int().nullable().optional(),
  /** 参加者。**脱退者も含む**（leftAt で見分ける）。件数が要るなら長さを取る */
  entries: z.array(LobbyEntrySchema),
  /** ホストの userId。`hostUserId === myUserId` で自分がホストか判定する */
  hostUserId: z.string(),
  createdAt: z.string(),
  updatedAt: z.string(),
});
export type LobbyListItem = z.infer<typeof LobbyListItemSchema>;

export const LobbySchema = z.object({
  id: z.string().uuid(),
  title: z.string(),
  description: z.string().nullable().optional(),
  scenarioName: z.string().nullable().optional(),
  location: z.string().nullable().optional(),
  status: LobbyStatusSchema,
  /** 下書きを抜けて動き出した時点。null なら draft（v0.2 の isPublished を置き換えた） */
  publishedAt: z.string().nullable(),
  maxPlayers: z.number().int().nullable().optional(),
  openUntil: z.string().nullable().optional(),
  /** ホストが**新しい参加の受付**を手動で閉じた時点。追加募集で null に戻る */
  receptionClosedAt: z.string().nullable(),
  /** **企画そのもの**を畳んだ日時（v0.2 の cancelledAt の改名）。終端状態 */
  disbandedAt: z.string().nullable().optional(),
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
  /** v2 の候補日に添える時間帯。dateNote は移行中の互換性のため残す */
  timeLabel: TimeLabelSchema.optional(),
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
    // v2 で必須から任意になった（design-v2 §6-13-1）。1件以上渡したときだけ
    // 日程調整 #1 とその候補日を同時に作る。省略すれば直接卓立ての経路になる
    candidateDates: z
      .array(LobbyCandidateDateInputSchema)
      .max(LOBBY_CANDIDATE_DATES_MAX_COUNT)
      .optional(),
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
    const dates = (input.candidateDates ?? []).map((entry) => entry.date);
    const pastDateIndex = (input.candidateDates ?? []).findIndex(
      (entry) => entry.date < today,
    );
    if (pastDateIndex !== -1) {
      ctx.addIssue({
        code: 'custom',
        path: ['candidateDates', pastDateIndex, 'date'],
        message: '候補日には今日以降の日付を指定してください',
      });
    }
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

/**
 * 遷移の**意図**を表す。現在のステータスそのものを送るのではない（design-v2 §6-13-2）。
 *
 * - `open`: 公開（published_at をセット）／追加募集（reception_closed_at をクリア）
 * - `closed`: 受付を閉じる（reception_closed_at をセット）。企画は継続する
 * - `disbanded`: 解散（disbanded_at をセット）。終端状態
 */
export const UpdateLobbyStatusInputSchema = z.object({
  status: z.enum(['open', 'closed', 'disbanded']),
});
export type UpdateLobbyStatusInput = z.infer<
  typeof UpdateLobbyStatusInputSchema
>;

// 募集枠メンバーは character_name を持たない（design-v1.1 §6）ため、
// 参加入力は空オブジェクト。将来的にフィールドが増える可能性に備えてスキーマ自体は残す。
export const JoinLobbyInputSchema = z.object({});
export type JoinLobbyInput = z.infer<typeof JoinLobbyInputSchema>;

export const JoinLobbyAsGuestInputSchema = z.object({
  guestName: z.string().min(1).max(100),
});
export type JoinLobbyAsGuestInput = z.infer<typeof JoinLobbyAsGuestInputSchema>;

/**
 * ゲストの参加・回答を認可するトークンを送るヘッダー名。
 * トークンは capability（資格情報）として扱い、クエリやボディではなくこのヘッダーで送る。
 * X- prefix は RFC 6648 で非推奨のため使用しない。
 *
 * v2 でトークンはロビーに1本化されたため、game-session.ts からここへ移した（design-v2 §6-5）。
 */
export const GUEST_TOKEN_HEADER = 'Guest-Token';

export const LobbyGuestLinkResponseSchema = z.object({
  token: z.string(),
});
export type LobbyGuestLinkResponse = z.infer<
  typeof LobbyGuestLinkResponseSchema
>;

// v2 日程調整（SchedulePoll）。旧 availability 契約は段階移行のため下に残す。
export const LobbyScheduleAnswerSchema = z.object({
  id: z.string().uuid(),
  entryId: z.string().uuid(),
  answer: z.enum(['ok', 'maybe', 'ng']),
  comment: z.string().max(500).nullable().optional(),
});
export type LobbyScheduleAnswer = z.infer<typeof LobbyScheduleAnswerSchema>;

export const LobbyCandidateDateSchema = z.object({
  id: z.string().uuid(),
  date: z.iso.date(),
  timeLabel: TimeLabelSchema,
});
export type LobbyCandidateDate = z.infer<typeof LobbyCandidateDateSchema>;

export const LobbyCandidateDateWithAnswersSchema =
  LobbyCandidateDateSchema.extend({
    answers: z.array(LobbyScheduleAnswerSchema),
  });
export type LobbyCandidateDateWithAnswers = z.infer<
  typeof LobbyCandidateDateWithAnswersSchema
>;

export const LobbySchedulePollSummarySchema = z.object({
  id: z.string().uuid(),
  createdAt: z.string(),
});
export type LobbySchedulePollSummary = z.infer<
  typeof LobbySchedulePollSummarySchema
>;

export const LobbySchedulePollSchema = z.object({
  id: z.string().uuid(),
  lobbyId: z.string().uuid(),
  candidateDates: z.array(LobbyCandidateDateWithAnswersSchema),
  createdAt: z.string(),
});
export type LobbySchedulePoll = z.infer<typeof LobbySchedulePollSchema>;

export const LobbyDetailSchema = LobbySchema.extend({
  /** 参加者。**脱退者も含めて全件返す**（leftAt で見分ける）。ホストが先頭、以降 joinedAt 昇順 */
  entries: z.array(LobbyEntrySchema),
  /** 日程調整の履歴。createdAt 降順で先頭が最新 */
  schedulePolls: z.array(LobbySchedulePollSummarySchema).optional(),
});
export type LobbyDetail = z.infer<typeof LobbyDetailSchema>;

/** SchedulePoll API 用の候補日入力。旧 dateNote を受け取らない v2 契約。 */
export const SchedulePollCandidateDateInputSchema = z.object({
  date: z.iso.date(),
  timeLabel: TimeLabelSchema.optional(),
});
export type SchedulePollCandidateDateInput = z.infer<
  typeof SchedulePollCandidateDateInputSchema
>;

export const CreateSchedulePollInputSchema = z
  .object({
    candidateDates: z
      .array(SchedulePollCandidateDateInputSchema)
      .min(1)
      .max(LOBBY_CANDIDATE_DATES_MAX_COUNT),
  })
  .superRefine((input, ctx) => {
    const today = todayDateString();
    const dates = input.candidateDates.map((entry) => entry.date);
    const pastDateIndex = input.candidateDates.findIndex(
      (entry) => entry.date < today,
    );
    if (pastDateIndex !== -1) {
      ctx.addIssue({
        code: 'custom',
        path: ['candidateDates', pastDateIndex, 'date'],
        message: '候補日には今日以降の日付を指定してください',
      });
    }
    if (new Set(dates).size !== dates.length) {
      ctx.addIssue({
        code: 'custom',
        path: ['candidateDates'],
        message: '候補日に重複する日付を含めることはできません',
      });
    }
  });
export type CreateSchedulePollInput = z.infer<
  typeof CreateSchedulePollInputSchema
>;

export const ReplaceCandidateDatesInputSchema = z
  .object({
    candidateDates: z
      .array(SchedulePollCandidateDateInputSchema)
      .min(1)
      .max(LOBBY_CANDIDATE_DATES_MAX_COUNT),
  })
  .superRefine((input, ctx) => {
    const dates = input.candidateDates.map((entry) => entry.date);
    if (new Set(dates).size !== dates.length) {
      ctx.addIssue({
        code: 'custom',
        path: ['candidateDates'],
        message: '候補日に重複する日付を含めることはできません',
      });
    }
  });
export type ReplaceCandidateDatesInput = z.infer<
  typeof ReplaceCandidateDatesInputSchema
>;

export const ScheduleAnswerItemSchema = z.object({
  candidateDateId: z.string().uuid(),
  answer: LobbyScheduleAnswerSchema.shape.answer,
  comment: z.string().max(500).nullable().optional(),
});
export type ScheduleAnswerItem = z.infer<typeof ScheduleAnswerItemSchema>;

export const UpsertScheduleAnswersInputSchema = z.object({
  answers: z.array(ScheduleAnswerItemSchema).min(1),
});
export type UpsertScheduleAnswersInput = z.infer<
  typeof UpsertScheduleAnswersInputSchema
>;

export const GuestUpsertScheduleAnswersInputSchema =
  UpsertScheduleAnswersInputSchema.extend({
    entryId: z.string().uuid(),
  });
export type GuestUpsertScheduleAnswersInput = z.infer<
  typeof GuestUpsertScheduleAnswersInputSchema
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
