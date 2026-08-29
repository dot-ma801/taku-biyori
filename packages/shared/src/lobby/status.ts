import { todayDateString } from '@/date';

export enum LobbyStatus {
  /** 下書き。まだ公開していない（ホストのみ閲覧可） */
  draft = 'draft',
  /** 受付中。新しい参加者を受け付けている */
  open = 'open',
  /** 受付終了。手動クローズ、または締め切り日の経過 */
  closed = 'closed',
  /** 解散。企画そのものを終了した（終端状態） */
  disbanded = 'disbanded',

  /**
   * @deprecated v2 では導出されない。`closed` に置き換わる（design-v2 §4-1）。
   * 移行タスク3 の backend PR で backend の導出が止まり、frontend PR で削除する。
   */
  scheduling = 'scheduling',
  /**
   * @deprecated v2 では導出されない。`disbanded` に置き換わる（design-v2 §4-1）。
   * 移行タスク3 の backend PR で backend の導出が止まり、frontend PR で削除する。
   */
  cancelled = 'cancelled',
}

/**
 * ステータス導出のもとになるファクト。
 *
 * `publishedAt` / `receptionClosedAt` / `disbandedAt` は有無だけを見るため、
 * Date（backend の DB 行）と ISO 文字列（frontend のレスポンス）のどちらでも受け取れる。
 * `openUntil` だけは今日との大小比較をするので `YYYY-MM-DD` に固定する
 * （`date` カラム・`format: date` のレスポンスがどちらもこの形）。
 */
export type LobbyStatusFacts = {
  publishedAt: Date | string | null;
  openUntil: string | null;
  receptionClosedAt: Date | string | null;
  disbandedAt: Date | string | null;
};

/**
 * ロビーのステータスを導出する（design-v2 §4-1）。**先頭一致**で判定する。
 *
 * | # | 条件 | ステータス |
 * |---|---|---|
 * | 1 | `disbandedAt != null` | `disbanded` |
 * | 2 | `publishedAt == null` | `draft` |
 * | 3 | `receptionClosedAt != null` | `closed` |
 * | 4 | `openUntil == null` または `today <= openUntil` | `open` |
 * | 5 | それ以外 | `closed` |
 *
 * backend と frontend が同じ関数を呼ぶ（design-v2 §4-5）。frontend が自前で導出できるため、
 * 日付をまたいで開いたままのページでも締め切りの経過が正しく反映される。
 *
 * @param today 比較に使う今日の日付（`YYYY-MM-DD`）。省略時は実行環境のローカル日付
 */
export const getLobbyStatus = (
  facts: LobbyStatusFacts,
  today: string = todayDateString(),
): LobbyStatus => {
  if (facts.disbandedAt) return LobbyStatus.disbanded;
  if (!facts.publishedAt) return LobbyStatus.draft;
  if (facts.receptionClosedAt) return LobbyStatus.closed;
  if (!facts.openUntil || today <= facts.openUntil) return LobbyStatus.open;
  return LobbyStatus.closed;
};
