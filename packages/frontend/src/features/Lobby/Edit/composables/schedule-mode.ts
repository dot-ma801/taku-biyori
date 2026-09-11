/**
 * ロビー作成時の日程の決め方（design-v2 §7-1）。
 *
 * v0.2 の「直接卓を立てる」画面（`/game-sessions/new`）は `fixed` モードとして
 * ロビー作成画面に統合した。
 */
export type ScheduleMode = 'poll' | 'fixed';

/**
 * 切り替えの選択肢。ラベルは「何をするか」を動詞で言い切る
 * （デザインシステムの文言ルール）。
 */
export const SCHEDULE_MODE_OPTIONS: {
  value: ScheduleMode;
  label: string;
  description: string;
}[] = [
  {
    value: 'poll',
    label: '候補日を出して決める',
    description: '参加する人に ◯ △ × で答えてもらってから開催日を決めます',
  },
  {
    value: 'fixed',
    label: '開催日を入れる',
    description: 'もう日程が決まっているときはこちら',
  },
];
