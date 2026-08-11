import { z } from 'zod';

/**
 * 候補日ごとの自由記述（UI ラベルは「ひとこと」）。
 *
 * 「13:00〜17:00」「午後から」「終日OK」を1フィールドで賄うため構造化せず、
 * 検証は文字数のみに留める。システム全体に時刻の概念が無く（候補日は `date` 型）、
 * 公開ロビー一覧に日時での絞り込みも無いため、構造化の見返りが現状ゼロなことによる。
 *
 * 自由記述である以上「この日がいちばんありがたい！」のような時間以外も書かれる。
 * よって中身（時間）ではなく関係（日付に紐づく）を名前にしている。
 */
export const DATE_NOTE_MAX_LENGTH = 20;

/** 空文字・空白のみは「未入力」として null に寄せる（DB に空文字を残さない） */
export const normalizeDateNote = (
  value: string | null | undefined,
): string | null => {
  if (value === null || value === undefined) return null;
  const trimmed = value.trim();
  return trimmed === '' ? null : trimmed;
};

// 保存されるのは正規化後の値なので、生の文字列長ではなく正規化後の長さで検証する
// （末尾の空白だけで上限を超えて弾かれることがないようにする）。
//
// parse 境界で normalizeDateNote() まで済ませておく（.transform）ことで、
// 書き込み経路が増えても正規化の呼び忘れが起きないようにする
// （呼び出し側で重ねて normalizeDateNote() を呼んでも冪等なので副作用はない）。
export const DateNoteSchema = z
  .string()
  .nullable()
  .refine(
    (value) => (normalizeDateNote(value) ?? '').length <= DATE_NOTE_MAX_LENGTH,
    { message: `ひとことは${DATE_NOTE_MAX_LENGTH}文字以内で入力してください` },
  )
  .transform((value) => normalizeDateNote(value));
