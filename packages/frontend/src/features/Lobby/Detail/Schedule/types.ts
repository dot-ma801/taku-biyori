// `ScheduleAnswerValue`（`@/models/schedule-poll`）の別名。composable / .vue からの
// 参照点をこの1ファイルに集約するための re-export で、型を二重定義しない
// （CLAUDE.md「新しい API を追加する手順」・issue #114 フェーズ2 の方針）。
export type { ScheduleAnswerValue as Answer } from '@/models/schedule-poll';
