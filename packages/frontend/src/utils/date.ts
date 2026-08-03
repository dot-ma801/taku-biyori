// パターンが増えてきたらフォーマット文字列方式（例: formatDate(str, 'M/D（ddd）')）への移行を検討する

const WEEKDAYS = ['日', '月', '火', '水', '木', '金', '土'] as const;

function parseDateParts(dateStr: string): {
  year: number;
  month: number;
  day: number;
} {
  const parts = dateStr.split('-');
  return {
    year: parseInt(parts[0] ?? '0'),
    month: parseInt(parts[1] ?? '0'),
    day: parseInt(parts[2] ?? '0'),
  };
}

/** "6/10" */
export function formatDateShort(dateStr: string): string {
  const { month, day } = parseDateParts(dateStr);
  return `${month}/${day}`;
}

/** "6/10（火）" */
export function formatDateWithWeekday(dateStr: string): string {
  const { year, month, day } = parseDateParts(dateStr);
  const weekday = WEEKDAYS[new Date(year, month - 1, day).getDay()] ?? '';
  return `${month}/${day}（${weekday}）`;
}

/**
 * "6/10 21:04"
 *
 * 日付文字列ではなく ISO 8601 のタイムスタンプ（瞬間）を受け取り、
 * 実行環境のローカル時刻で表示する。パースできない場合は空文字を返す。
 */
export function formatDateTimeShort(isoString: string): string {
  const date = new Date(isoString);
  if (Number.isNaN(date.getTime())) return '';

  const month = date.getMonth() + 1;
  const day = date.getDate();
  const hours = String(date.getHours()).padStart(2, '0');
  const minutes = String(date.getMinutes()).padStart(2, '0');
  return `${month}/${day} ${hours}:${minutes}`;
}
