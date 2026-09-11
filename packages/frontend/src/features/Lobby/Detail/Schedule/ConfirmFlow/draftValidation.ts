import {
  GAME_SESSION_OVERRIDE_MAX_LENGTHS,
  normalizeTimeLabel,
} from '@taku-biyori/shared';

/**
 * 確定ステップの上書き項目の検証。
 *
 * 上限は `@taku-biyori/shared` の `GAME_SESSION_OVERRIDE_MAX_LENGTHS`（API の契約）
 * をそのまま使う。ここに数値を書き写すと、契約だけ動かしたときに
 * 「画面は通るのに 400」が起きる。
 *
 * 画面に出す名前は固定語彙（design-v2 §2-2）に合わせる。`GameSession` という
 * 概念は利用者に見せないので、エラー文にも「開催」を出さない。
 */

export type GameSessionDraftField =
  keyof typeof GAME_SESSION_OVERRIDE_MAX_LENGTHS;

const FIELD_LABELS: Record<GameSessionDraftField, string> = {
  title: '卓名',
  scenarioName: 'シナリオ名',
  location: '場所',
  timeLabel: '時間帯',
  description: '当日の連絡事項',
};

/**
 * 検証に使う長さ。
 *
 * 時間帯だけは**正規化後**で数える。送信も正規化後の値なので、生値で数えると
 * 前後の空白ぶんだけ基準がずれる（候補日のひとことと同じ扱い）。
 */
const lengthOf = (field: GameSessionDraftField, value: string): number =>
  field === 'timeLabel'
    ? (normalizeTimeLabel(value) ?? '').length
    : value.length;

/** 1項目ぶんのエラー文言。問題なければ null を返す */
export const getDraftFieldError = (
  field: GameSessionDraftField,
  value: string,
): string | null => {
  const max = GAME_SESSION_OVERRIDE_MAX_LENGTHS[field];
  return lengthOf(field, value) > max
    ? `${FIELD_LABELS[field]}は${max}文字以内で入力してください`
    : null;
};

/** 入力欄に添える文字数カウンター（候補日の入力と同じ `N / MAX` 形式） */
export const getDraftFieldCounter = (
  field: GameSessionDraftField,
  value: string,
): { label: string; isOver: boolean } => {
  const max = GAME_SESSION_OVERRIDE_MAX_LENGTHS[field];
  const length = lengthOf(field, value);
  return { label: `${length} / ${max}`, isOver: length > max };
};

/** 上書き項目すべてに問題が無いか。確定ボタンの活性判定に使う */
export const isDraftValid = (
  draft: Record<GameSessionDraftField, string>,
): boolean =>
  (Object.keys(FIELD_LABELS) as GameSessionDraftField[]).every(
    (field) => getDraftFieldError(field, draft[field]) === null,
  );
