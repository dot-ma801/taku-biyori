import { z } from 'zod';
import { GameSessionStatus } from '@/game-session/status';
import { LobbyStatus } from '@/lobby/status';
import { SeatRefSchema, SeatSchema } from '@/game-session/seat';
import { todayDateString } from '@/date';

export { GameSessionStatus };

/**
 * v2 レスポンスのステータス。`getGameSessionStatus()` が導出する4値だけを許す（design-v2 §4-2）。
 *
 * `GameSessionStatus` enum には移行期間中だけ `draft` / `open` / `confirmed` が残っているが、
 * v2 では導出されない値なので v2 の DTO では受け付けない。
 * 旧 DTO は `LegacyGameSessionStatusSchema` を使う。
 */
export const GameSessionStatusSchema = z.enum([
  GameSessionStatus.scheduled,
  GameSessionStatus.today,
  GameSessionStatus.completed,
  GameSessionStatus.cancelled,
]);

// ============================================================
// v2 契約（design-v2 §5-5 / §6-5 / §6-13-5）
// ============================================================

/**
 * **編集フォーム用の生値。** `null` は「上書きしていない」を意味する。
 *
 * 解決済みの値（`resolveGameSessionDisplay()` の戻り値）をフォームの初期値に使ってはいけない。
 * 上書きしていない項目にもロビーの値が入って見え、そのまま保存すると意図しない上書きが発生して
 * 以後ロビーを改名しても追随しなくなる（design-v2 §5-5）。
 *
 * `description`（当日の連絡事項）は上書きではなくセッション固有のファクトなので、ここには含まれない。
 */
export const GameSessionOverridesSchema = z.object({
  title: z.string().nullable(),
  scenarioName: z.string().nullable(),
  location: z.string().nullable(),
  timeLabel: z.string().nullable(),
});
export type GameSessionOverrides = z.infer<typeof GameSessionOverridesSchema>;

/**
 * セッション詳細に埋め込むロビー情報。**3つの役割を兼ねる**（design-v2 §6-13-5）。
 *
 * 1. **既定値の出所** — `overrides.*` が null のとき表示に使う値
 * 2. パンくず・戻り導線
 * 3. 閲覧者がホストかどうかの判定（`hostUserId`）
 *
 * ロビー全体を埋め込まないのは、`entries` や `gameSessions` まで抱えると重くなるため。
 */
export const LobbySummarySchema = z.object({
  id: z.string().uuid(),
  title: z.string(),
  scenarioName: z.string().nullable(),
  location: z.string().nullable(),
  maxPlayers: z.number().int().nullable(),
  hostUserId: z.string(),
  status: z.nativeEnum(LobbyStatus),
});
export type LobbySummary = z.infer<typeof LobbySummarySchema>;

/**
 * セッション（1回の開催）。
 *
 * **解決済みの表示値は返さない。** `title` / `scenarioName` / `location` は
 * 上書きの生値（`overrides`）とロビーの既定値（`lobby`）から求める。
 * クライアントは `resolveGameSessionDisplay()` を呼ぶ（design-v2 §5-5・§6-1）。
 *
 * v0.2 から消えたフィールド: `isPublished`・`maxMembers`・`createdBy`（すべてロビーの関心事）。
 */
export const GameSessionSchema = z.object({
  id: z.string().uuid(),
  /** **非 null**。セッションは必ずロビーに属する（design-v2 §9-3） */
  lobbyId: z.string().uuid(),
  /**
   * 開催日。「この日に開くと決めた」という決定のファクトで、候補日のコピーではない。
   * `GameSession → CandidateDate` の出自リンクは持たない。
   */
  scheduledAt: z.string(),
  status: GameSessionStatusSchema,
  /**
   * 当日の連絡事項（VC・部屋の URL・集合情報など）。
   * **上書き項目ではなくセッション固有のファクト**なので `overrides` に入らない。
   */
  description: z.string().nullable(),
  overrides: GameSessionOverridesSchema,
  lobby: LobbySummarySchema,
  completedAt: z.string().nullable(),
  /** 開催の中止日時。ロビー側の `disbandedAt`（企画の解散）とは別概念 */
  cancelledAt: z.string().nullable(),
  createdAt: z.string(),
  updatedAt: z.string(),
});
export type GameSession = z.infer<typeof GameSessionSchema>;

export const GameSessionDetailSchema = GameSessionSchema.extend({
  /** 着席者。`seatedAt` 昇順。v0.2 の `members` の改名 */
  seats: z.array(SeatSchema),
});
export type GameSessionDetail = z.infer<typeof GameSessionDetailSchema>;

/**
 * セッション一覧表示用の軽量スキーマ。
 *
 * `title` / `scenarioName` / `timeLabel` は一覧の文脈では**解決済み**の値を返す。
 * 一覧はロビーが自明な文脈で使われるため、要素ごとに `lobby` を繰り返さない（design-v2 §5-5）。
 */
export const GameSessionListItemSchema = z.object({
  id: z.string().uuid(),
  lobbyId: z.string().uuid(),
  /** 解決済み（未設定ならロビーの title） */
  title: z.string(),
  scenarioName: z.string().nullable(),
  status: GameSessionStatusSchema,
  scheduledAt: z.string(),
  timeLabel: z.string().nullable(),
  seats: z.array(SeatRefSchema),
  /** ロビーのホスト。`hostUserId === myUserId` で自分がホストか判定する（v0.2 の `role` を置き換えた） */
  hostUserId: z.string(),
  createdAt: z.string(),
  updatedAt: z.string(),
});
export type GameSessionListItem = z.infer<typeof GameSessionListItemSchema>;

/**
 * ロビー詳細に埋め込む開催の軽量表現（design-v2 §6-13-4）。
 * 親がロビーそのものなので `lobby` を持たず、解決済みの表示値を持つ。
 */
export const GameSessionSummarySchema = z.object({
  id: z.string().uuid(),
  scheduledAt: z.string(),
  status: GameSessionStatusSchema,
  /** 解決済み（未設定ならロビーの title） */
  title: z.string(),
  timeLabel: z.string().nullable(),
  seats: z.array(SeatRefSchema),
});
export type GameSessionSummary = z.infer<typeof GameSessionSummarySchema>;

/**
 * セッションを開く入力（design-v2 §5-2）。v0.2 の `ConfirmLobbyInput` の後継。
 *
 * `candidateId` は受け取らず `scheduledAt` を直接受け取る。開催日の決定は新しいファクトであり、
 * 候補日のコピーではないため。「候補日を選ぶ」のは UI の仕事で、
 * フロントが選ばれた候補日の `date` を送る。
 *
 * 上書き項目は渡したときだけ保存し、既定値は書き込まない。
 */
export const CreateGameSessionInputSchema = z
  .object({
    /** 開催日。**今日以降**（過ぎた日に新しい開催は作らせない） */
    scheduledAt: z.iso.date(),
    /**
     * 着席させる LobbyEntry の ID の配列。1件以上必須。
     * このロビーのものでない ID、または脱退済み（`leftAt != null`）の ID を含むと 422。
     * v0.2 の `memberIds` の改名。
     */
    entryIds: z.array(z.string().uuid()).min(1),
    title: z.string().min(1).max(100).optional(),
    scenarioName: z.string().max(200).optional(),
    location: z.string().max(200).optional(),
    timeLabel: z.string().max(20).optional(),
    description: z.string().max(1000).optional(),
  })
  .refine((input) => input.scheduledAt >= todayDateString(), {
    message: '開催日には今日以降の日付を指定してください',
    path: ['scheduledAt'],
  });
export type CreateGameSessionInput = z.infer<
  typeof CreateGameSessionInputSchema
>;

/**
 * セッションの partial 更新。キーを省略すると変更しない。
 *
 * **上書き項目に `null` を渡すと上書きを解除する**（以後ロビーの値に追随する）。
 * この2つを区別できることが `overrides` を返している理由なので、
 * フロントは「フォームが空 → `null` を送る」を守ること。
 */
export const UpdateGameSessionInputSchema = z
  .object({
    /** 開催日。null への更新は受け付けない（セッションは必ず日程を持つ） */
    scheduledAt: z.iso.date().optional(),
    /** null で上書き解除 */
    title: z.string().min(1).max(100).nullable().optional(),
    scenarioName: z.string().max(200).nullable().optional(),
    location: z.string().max(200).nullable().optional(),
    timeLabel: z.string().max(20).nullable().optional(),
    /** 当日の連絡事項。上書きではないので null はクリアを意味する */
    description: z.string().max(1000).nullable().optional(),
  })
  .refine((input) => Object.keys(input).length > 0, {
    message: '少なくとも1つのフィールドが必要です',
  });
export type UpdateGameSessionInput = z.infer<
  typeof UpdateGameSessionInputSchema
>;

/**
 * セッションのステータス遷移（design-v2 §6-13-6）。
 *
 * v0.2 にあった `open` は廃止した（セッションに公開の概念が無くなったため）。
 * どちらも終端状態で、逆方向（完了・中止の取り消し）は無い。
 */
export const UpdateGameSessionStatusInputSchema = z.object({
  status: z.enum(['completed', 'cancelled']),
});
export type UpdateGameSessionStatusInput = z.infer<
  typeof UpdateGameSessionStatusInputSchema
>;

// ============================================================
// v0.2 契約（移行期間中だけ残す）
//
// 新モデルへ載せ替える前の卓（`game_session_members` 前提）の経路が使っている。
// 旧 UI を置き換える PR でまとめて削除する。新しい実装からは参照しないこと。
// ============================================================

/**
 * 旧 DTO のステータス。移行期の `draft` / `open` / `confirmed` を含む enum 全体を受ける。
 *
 * @deprecated v2 の4ステータス（`GameSessionStatusSchema`）へ移行する
 */
export const LegacyGameSessionStatusSchema = z.nativeEnum(GameSessionStatus);

/** @deprecated `GameSessionListItem` へ移行する */
export const LegacyGameSessionListItemSchema = z.object({
  id: z.string().uuid(),
  title: z.string(),
  scenarioName: z.string().nullable().optional(),
  status: LegacyGameSessionStatusSchema,
  isPublished: z.boolean(),
  memberCount: z.number().int(),
  maxMembers: z.number().int().nullable().optional(),
  scheduledAt: z.string(),
  createdAt: z.string(),
  updatedAt: z.string(),
  role: z.enum(['host', 'member']).nullable(),
});
/** @deprecated `GameSessionListItem` へ移行する */
export type LegacyGameSessionListItem = z.infer<
  typeof LegacyGameSessionListItemSchema
>;

/** @deprecated `GameSession` へ移行する */
export const LegacyGameSessionSchema = z.object({
  id: z.string().uuid(),
  title: z.string(),
  description: z.string().nullable().optional(),
  scenarioName: z.string().nullable().optional(),
  location: z.string().nullable().optional(),
  status: LegacyGameSessionStatusSchema,
  isPublished: z.boolean(),
  scheduledAt: z.string(),
  completedAt: z.string().nullable().optional(),
  cancelledAt: z.string().nullable().optional(),
  maxMembers: z.number().int().nullable().optional(),
  createdBy: z.string(),
  createdAt: z.string(),
  updatedAt: z.string(),
});
/** @deprecated `GameSession` へ移行する */
export type LegacyGameSession = z.infer<typeof LegacyGameSessionSchema>;

/** @deprecated `UpdateGameSessionInput` へ移行する */
export const LegacyUpdateGameSessionInputSchema = z
  .object({
    title: z.string().min(1).max(100).optional(),
    description: z.string().max(1000).nullable().optional(),
    scenarioName: z.string().max(200).nullable().optional(),
    location: z.string().max(200).nullable().optional(),
    maxMembers: z.number().int().min(2).max(20).nullable().optional(),
    scheduledAt: z.iso.date().optional(),
  })
  .refine((input) => Object.keys(input).length > 0, {
    message: '少なくとも1つのフィールドが必要です',
  });
/** @deprecated `UpdateGameSessionInput` へ移行する */
export type LegacyUpdateGameSessionInput = z.infer<
  typeof LegacyUpdateGameSessionInputSchema
>;

/** @deprecated `UpdateGameSessionStatusInput` へ移行する */
export const LegacyUpdateGameSessionStatusInputSchema = z.object({
  status: z.enum(['open', 'completed', 'cancelled']),
});
/** @deprecated `UpdateGameSessionStatusInput` へ移行する */
export type LegacyUpdateGameSessionStatusInput = z.infer<
  typeof LegacyUpdateGameSessionStatusInputSchema
>;

/** @deprecated `Seat` へ移行する */
export const GameSessionMemberSchema = z.object({
  id: z.string().uuid(),
  userId: z.string().nullable(),
  userName: z.string().nullable(),
  guestName: z.string().nullable(),
  characterName: z.string().nullable(),
  joinedAt: z.string(),
});
/** @deprecated `Seat` へ移行する */
export type GameSessionMember = z.infer<typeof GameSessionMemberSchema>;

/** @deprecated `GameSessionDetail` へ移行する */
export const LegacyGameSessionDetailSchema = LegacyGameSessionSchema.extend({
  members: z.array(GameSessionMemberSchema),
});
/** @deprecated `GameSessionDetail` へ移行する */
export type LegacyGameSessionDetail = z.infer<
  typeof LegacyGameSessionDetailSchema
>;

/** @deprecated 自分で着席する経路は廃止した（design-v2 §6-6） */
export const JoinGameSessionInputSchema = z.object({
  characterName: z.string().max(100).optional(),
});
/** @deprecated 自分で着席する経路は廃止した（design-v2 §6-6） */
export type JoinGameSessionInput = z.infer<typeof JoinGameSessionInputSchema>;

/** @deprecated `UpdateSeatInput` へ移行する */
export const UpdateMemberInputSchema = z
  .object({
    characterName: z.string().max(100).nullable().optional(),
  })
  .refine((input) => Object.keys(input).length > 0, {
    message: '少なくとも1つのフィールドが必要です',
  });
/** @deprecated `UpdateSeatInput` へ移行する */
export type UpdateMemberInput = z.infer<typeof UpdateMemberInputSchema>;
