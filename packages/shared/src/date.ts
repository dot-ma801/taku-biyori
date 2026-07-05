/**
 * 今日の日付を `YYYY-MM-DD` 形式で返す。
 *
 * NOTE: 実行環境のローカルタイムゾーンに依存する（UTC ではなくローカル時刻の年月日を使う）。
 * サーバー・クライアントでタイムゾーンが異なる環境では日付がずれる可能性がある点に注意。
 */
export const todayDateString = (): string => {
  const now = new Date();
  const y = now.getFullYear();
  const m = String(now.getMonth() + 1).padStart(2, '0');
  const d = String(now.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
};
