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
export enum GameSessionCardStatus {
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
export const GAME_SESSION_CARD_STATUS_LABEL: Record<
  GameSessionCardStatus,
  string
> = {
  [GameSessionCardStatus.draft]: '下書き',
  [GameSessionCardStatus.recruiting]: '募集中',
  [GameSessionCardStatus.adjusting]: '調整中',
  [GameSessionCardStatus.scheduled]: '開催予定',
  [GameSessionCardStatus.completed]: '完了',
  [GameSessionCardStatus.cancelled]: '中止',
};

/** バッジのトーン。BaseBadge の variant にそのまま渡せる値にしてある */
export type GameSessionCardTone =
  | 'default'
  | 'primary'
  | 'success'
  | 'warning'
  | 'error';

export const GAME_SESSION_CARD_STATUS_TONE: Record<
  GameSessionCardStatus,
  GameSessionCardTone
> = {
  [GameSessionCardStatus.draft]: 'default',
  [GameSessionCardStatus.recruiting]: 'success',
  [GameSessionCardStatus.adjusting]: 'warning',
  [GameSessionCardStatus.scheduled]: 'primary',
  [GameSessionCardStatus.completed]: 'default',
  [GameSessionCardStatus.cancelled]: 'error',
};

/** 一覧のタブに並べる順。`draft` は含めない（下書きはダッシュボードの1行だけ） */
export const GAME_SESSION_LIST_TAB_STATUSES: readonly GameSessionCardStatus[] =
  [
    GameSessionCardStatus.recruiting,
    GameSessionCardStatus.adjusting,
    GameSessionCardStatus.scheduled,
    GameSessionCardStatus.completed,
    GameSessionCardStatus.cancelled,
  ];
