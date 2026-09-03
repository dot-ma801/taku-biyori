import { z } from 'zod';
import { GameSessionStatus } from '@/game-session/status';

export const GameSessionPlayMemoSchema = z.object({
  seatId: z.string().uuid(),
  body: z.string(),
  /** 公開日時。null なら非公開 */
  sharedAt: z.string().nullable(),
  updatedAt: z.string(),
});
export type GameSessionPlayMemo = z.infer<typeof GameSessionPlayMemoSchema>;

/**
 * 自分のメモのレスポンス。
 *
 * メモを一度も書いていないメンバーにも 404 ではなく空メモを返すため（design-v1.2 §8）、
 * まだ行が存在しないケースを表す `updatedAt: null` を許容する。
 */
export const MyGameSessionPlayMemoSchema = GameSessionPlayMemoSchema.extend({
  updatedAt: z.string().nullable(),
});
export type MyGameSessionPlayMemo = z.infer<typeof MyGameSessionPlayMemoSchema>;

/** 公開メモ一覧の要素。公開済みのみを返すため sharedAt は non-null */
export const SharedGameSessionPlayMemoSchema = GameSessionPlayMemoSchema.extend(
  {
    sharedAt: z.string(),
  },
);
export type SharedGameSessionPlayMemo = z.infer<
  typeof SharedGameSessionPlayMemoSchema
>;

// 本文の上限は 5000 文字（卓の description の 1000 文字より広い。プレイ中の記録は長文になるため）。
// UI の文字数カウンタと API のバリデーションで同じ値を使うため定数として公開する。
export const GAME_SESSION_PLAY_MEMO_MAX_LENGTH = 5000;

// 空文字の保存を許可する（本文を空にしても行を残し、公開状態を失わせない。design-v1.2 §8）
export const UpsertGameSessionPlayMemoInputSchema = z.object({
  body: z.string().max(GAME_SESSION_PLAY_MEMO_MAX_LENGTH),
});
export type UpsertGameSessionPlayMemoInput = z.infer<
  typeof UpsertGameSessionPlayMemoInputSchema
>;

// 公開・非公開の切替は全ステータスで許可するため、ステータスに関する入力は持たない
// （切替がステータス非依存であることを、入力に持たせないことで表現する。design-v1.2 §4）
export const UpdateGameSessionPlayMemoVisibilityInputSchema = z.object({
  /** true で公開（shared_at を現在時刻に）、false で非公開（shared_at を null に） */
  shared: z.boolean(),
});
export type UpdateGameSessionPlayMemoVisibilityInput = z.infer<
  typeof UpdateGameSessionPlayMemoVisibilityInputSchema
>;

/**
 * 他メンバーの公開メモを閲覧できるステータスかどうか。
 *
 * 閲覧者のロールに依存しない（未ログイン・ゲストも含めて誰でも読める）ため、
 * roles を持つ ACTION_POLICIES ではなくステータス単独の関数として定義する。
 */
export const canViewSharedPlayMemos = (status: GameSessionStatus): boolean =>
  status === GameSessionStatus.completed ||
  status === GameSessionStatus.cancelled;
