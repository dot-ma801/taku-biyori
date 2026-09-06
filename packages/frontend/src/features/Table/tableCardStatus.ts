/**
 * 卓（UI上の単位）の状態。
 *
 * データ側は Lobby（4状態）と GameSession（4状態）に分かれたままだが、
 * 利用者に見せるのは「卓」1つ・下記の1系列だけにする（#147）。
 *
 * ```
 * 募集中 → 調整中 → 開催予定 → 完了 / 中止
 * ```
 *
 * `draft` は上の系列の外。下書きはホストにしか見えず、一覧のタブにも並べない。
 */
export enum TableCardStatus {
  draft = 'draft',
  recruiting = 'recruiting',
  adjusting = 'adjusting',
  scheduled = 'scheduled',
  completed = 'completed',
  cancelled = 'cancelled',
}

/**
 * 状態の表示ラベル。
 *
 * デザインシステムが「固定語彙。そのまま使うこと」と定めている文言なので、
 * 画面ごとに書かずここから引く。
 */
export const TABLE_CARD_STATUS_LABEL: Record<TableCardStatus, string> = {
  [TableCardStatus.draft]: '下書き',
  [TableCardStatus.recruiting]: '募集中',
  [TableCardStatus.adjusting]: '調整中',
  [TableCardStatus.scheduled]: '開催予定',
  [TableCardStatus.completed]: '完了',
  [TableCardStatus.cancelled]: '中止',
};

/** バッジのトーン。BaseBadge の variant にそのまま渡せる値にしてある */
export type TableCardTone =
  | 'default'
  | 'primary'
  | 'success'
  | 'warning'
  | 'error';

export const TABLE_CARD_STATUS_TONE: Record<TableCardStatus, TableCardTone> = {
  [TableCardStatus.draft]: 'default',
  [TableCardStatus.recruiting]: 'success',
  [TableCardStatus.adjusting]: 'warning',
  [TableCardStatus.scheduled]: 'primary',
  [TableCardStatus.completed]: 'default',
  [TableCardStatus.cancelled]: 'error',
};

/** 一覧のタブに並べる順。`draft` は含めない（下書きはダッシュボードの1行だけ） */
export const TABLE_LIST_TAB_STATUSES: readonly TableCardStatus[] = [
  TableCardStatus.recruiting,
  TableCardStatus.adjusting,
  TableCardStatus.scheduled,
  TableCardStatus.completed,
  TableCardStatus.cancelled,
];
