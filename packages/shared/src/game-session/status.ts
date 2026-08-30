import { todayDateString } from '@/date';

export enum GameSessionStatus {
  /** 開催予定。開催日が決まっている（未来・または過ぎたが未完了） */
  scheduled = 'scheduled',
  /** 本日開催。開催日が今日 */
  today = 'today',
  /** 完了。開催を終えた（終端状態） */
  completed = 'completed',
  /** 中止。この回の開催を取りやめた（終端状態） */
  cancelled = 'cancelled',

  // ---- 移行期間中だけ残す v0.2 の値（design-v2 §4-2 では廃止）----
  // getGameSessionStatus() はこれらを導出しない。旧経路の型解決のためだけに残しており、
  // 旧 UI を置き換える PR で削除する。
  /** @deprecated 公開はロビーの関心事へ移った（v2 では導出しない） */
  draft = 'draft',
  /** @deprecated 募集はロビーの関心事へ移った（v2 では導出しない） */
  open = 'open',
  /** @deprecated `scheduled` に改名（v2 では導出しない） */
  confirmed = 'confirmed',
}

/**
 * ステータス導出のもとになるファクト。
 *
 * `completedAt` / `cancelledAt` は有無だけを見るため、Date（backend の DB 行）と
 * ISO 文字列（frontend のレスポンス）のどちらでも受け取れる。
 * `scheduledAt` だけは今日との日付比較をするので `YYYY-MM-DD` に固定する
 * （`date` カラム・`format: date` のレスポンスがどちらもこの形）。
 */
export type GameSessionStatusFacts = {
  scheduledAt: string;
  completedAt: Date | string | null;
  cancelledAt: Date | string | null;
};

/**
 * セッション（1回の開催）のステータスを導出する（design-v2 §4-2）。**先頭一致**で判定する。
 *
 * | # | 条件 | ステータス |
 * |---|---|---|
 * | 1 | `cancelledAt != null` | `cancelled` |
 * | 2 | `completedAt != null` | `completed` |
 * | 3 | `scheduledAt` が今日と同じ日付 | `today` |
 * | 4 | それ以外 | `scheduled` |
 *
 * backend と frontend が同じ関数を呼ぶ（design-v2 §4-5）。v0.2 では backend の
 * `game-session/domain/game-session-status.ts` にだけ実装があり、frontend は
 * レスポンスの `status` を信じるしかなかった。frontend が自前で導出できるようになったため、
 * 日付をまたいで開いたままのページでも `today` が正しく表示される
 * （ただし導出されるのは呼び出した時点の値なので、反映には再導出または再取得が要る）。
 *
 * @param today 比較に使う今日の日付（`YYYY-MM-DD`）。省略時は実行環境のローカル日付
 */
export const getGameSessionStatus = (
  facts: GameSessionStatusFacts,
  today: string = todayDateString(),
): GameSessionStatus => {
  if (facts.cancelledAt) return GameSessionStatus.cancelled;
  if (facts.completedAt) return GameSessionStatus.completed;
  if (facts.scheduledAt === today) return GameSessionStatus.today;
  return GameSessionStatus.scheduled;
};
