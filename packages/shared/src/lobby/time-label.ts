import { z } from 'zod';

/** 候補日に添える時間帯ラベルの最大文字数。 */
export const TIME_LABEL_MAX_LENGTH = 20;

/** 空文字・空白のみは「未入力」として null に寄せる。 */
export const normalizeTimeLabel = (
  value: string | null | undefined,
): string | null => {
  if (value === null || value === undefined) return null;
  const trimmed = value.trim();
  return trimmed === '' ? null : trimmed;
};

/** 候補日に添える時間帯の自由記述。parse 境界で正規化まで行う。 */
export const TimeLabelSchema = z
  .string()
  .nullable()
  .refine(
    (value) =>
      (normalizeTimeLabel(value) ?? '').length <= TIME_LABEL_MAX_LENGTH,
    {
      message: `時間帯は${TIME_LABEL_MAX_LENGTH}文字以内で入力してください`,
    },
  )
  .transform((value) => normalizeTimeLabel(value));
