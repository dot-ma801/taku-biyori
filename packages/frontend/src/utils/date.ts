// パターンが増えてきたらフォーマット文字列方式（例: formatDate(str, 'M/D（ddd）')）への移行を検討する

const WEEKDAYS = ['日', '月', '火', '水', '木', '金', '土'] as const;

function parseDateParts(dateStr: string): { year: number; month: number; day: number } {
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
