import { z } from 'zod';

/** 時刻メモの最大文字数 */
export const TIME_NOTE_MAX_LENGTH = 50;

/**
 * 時刻メモ。「午後から」「19:00〜」「終日OK」のように粒度の異なる書き方を
 * 1 つのフィールドで受けたいため、開始・終了に構造化せず自由記述とする。
 *
 * 空文字・空白のみは null に正規化し、DB に「空文字」と NULL という
 * 2 通りの未入力状態が混在しないようにする。
 */
export const TimeNoteSchema = z
  .string()
  .max(
    TIME_NOTE_MAX_LENGTH,
    `時刻メモは${TIME_NOTE_MAX_LENGTH}文字以内で入力してください`,
  )
  .transform((value) => value.trim() || null)
  .nullable()
  .optional();
