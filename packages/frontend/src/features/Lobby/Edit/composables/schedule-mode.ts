/**
 * ロビー作成時の日程の決め方（design-v2 §7-1）。
 *
 * v0.2 の「直接卓を立てる」画面（`/game-sessions/new`）は `fixed` モードとして
 * ロビー作成画面に統合した。
 */
export type ScheduleMode = 'poll' | 'fixed';

export const SCHEDULE_MODE_OPTIONS: { value: ScheduleMode; label: string }[] = [
  { value: 'poll', label: '候補日から調整する' },
  { value: 'fixed', label: '日程が決まっている' },
];
