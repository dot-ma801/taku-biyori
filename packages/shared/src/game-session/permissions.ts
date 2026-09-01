import { GameSessionStatus } from '@/game-session/status';

export type GameSessionRole = 'host' | 'member';

// ============================================================
// v2 の操作可否（design-v2 §4-3 の表をそのまま落としたもの）
// ============================================================

export enum GameSessionAction {
  /** セッションの編集 */
  editGameSession = 'editGameSession',
  /** セッションの完了 */
  completeGameSession = 'completeGameSession',
  /** セッションの中止 */
  cancelGameSession = 'cancelGameSession',
  /** セッションの削除 */
  deleteGameSession = 'deleteGameSession',
  /** 着席させる（選出） */
  seatEntry = 'seatEntry',
  /** 離席（着席の解除） */
  unseat = 'unseat',
  /** キャラクター名の割り当て・解除 */
  assignCharacter = 'assignCharacter',
  /** プレイメモの本文編集 */
  editSeatPlayMemo = 'editSeatPlayMemo',
  /** プレイメモの公開切替 */
  toggleSeatPlayMemoVisibility = 'toggleSeatPlayMemoVisibility',
  /** 公開メモの閲覧 */
  viewSharedSeatPlayMemos = 'viewSharedSeatPlayMemos',
}

type GameSessionActionPolicy = {
  roles: GameSessionRole[];
  statuses: GameSessionStatus[];
};

/** v2 で導出される4ステータス（design-v2 §4-2）。旧値は移行期間中も許可しない */
const ALL: GameSessionStatus[] = [
  GameSessionStatus.scheduled,
  GameSessionStatus.today,
  GameSessionStatus.completed,
  GameSessionStatus.cancelled,
];

/** 開催前・当日。「これから動きうる」ことを表す2ステータス */
const BEFORE_END: GameSessionStatus[] = [
  GameSessionStatus.scheduled,
  GameSessionStatus.today,
];

/** 中止以外。中止した開催は記録として凍結する */
const NOT_CANCELLED: GameSessionStatus[] = [
  GameSessionStatus.scheduled,
  GameSessionStatus.today,
  GameSessionStatus.completed,
];

/** 終わった開催。公開メモが読めるのはここから */
const ENDED: GameSessionStatus[] = [
  GameSessionStatus.completed,
  GameSessionStatus.cancelled,
];

/**
 * セッションの操作可否（API 契約）。フロントの表示制御とバックエンドのバリデーションで同じ表を使う。
 *
 * **ロールとステータスの2軸で決まらない条件はこの表に入れない**（design-v2 §4-5）。
 * 件数（削除の「着席者がホストのみ」）、本人性（離席・プレイメモが本人か）は use case 側で判定する。
 *
 * v0.2 の `update-game-session-status.ts` は `cancelled` への遷移だけこの表を通さず
 * ハードコード判定していたが、v2 ではそうした抜け道を作らない。
 */
export const ACTION_POLICIES: Record<
  GameSessionAction,
  GameSessionActionPolicy
> = {
  [GameSessionAction.editGameSession]: {
    roles: ['host'],
    statuses: NOT_CANCELLED,
  },
  [GameSessionAction.completeGameSession]: {
    roles: ['host'],
    statuses: BEFORE_END,
  },
  [GameSessionAction.cancelGameSession]: {
    roles: ['host'],
    statuses: BEFORE_END,
  },
  // §4-3 は「`cancelled`、または着席者がホスト本人のみ」。後半は件数条件なので
  // この表には入れず use case 側で OR を取る（§4-5）
  [GameSessionAction.deleteGameSession]: {
    roles: ['host'],
    statuses: [GameSessionStatus.cancelled],
  },
  // 着席させられるのはホストだけ。選出はホストの仕事であり、Seat は選出のファクト（§6-6）
  [GameSessionAction.seatEntry]: {
    roles: ['host'],
    statuses: BEFORE_END,
  },
  // 「本人またはホスト」の本人性は use case 側で判定する
  [GameSessionAction.unseat]: {
    roles: ['host', 'member'],
    statuses: BEFORE_END,
  },
  // 完了後にキャラ名を埋める運用があるため completed でも許可する
  [GameSessionAction.assignCharacter]: {
    roles: ['host', 'member'],
    statuses: NOT_CANCELLED,
  },
  // ホストもプレイヤーとして自分のメモを持つため両ロールを許可する。
  // 「本人のメモであること」はロールでは表現できないため別途検証する
  [GameSessionAction.editSeatPlayMemo]: {
    roles: ['host', 'member'],
    statuses: BEFORE_END,
  },
  // 公開切替は本文の保存と違いステータス非依存（常時）
  [GameSessionAction.toggleSeatPlayMemoVisibility]: {
    roles: ['host', 'member'],
    statuses: ALL,
  },
  [GameSessionAction.viewSharedSeatPlayMemos]: {
    roles: ['host', 'member'],
    statuses: ENDED,
  },
};

export function canPerform(
  action: GameSessionAction,
  status: GameSessionStatus,
  role: GameSessionRole,
): boolean {
  const { roles, statuses } = ACTION_POLICIES[action];
  return roles.includes(role) && statuses.includes(status);
}

// ============================================================
// v0.2 の操作可否（移行期間中だけ残す）
//
// 新モデルへ載せ替える前の卓の経路が使っている。旧 UI を置き換える PR で削除する。
// ============================================================

/** @deprecated `GameSessionAction` へ移行する */
export enum LegacyGameSessionAction {
  joinSession = 'joinSession',
  leaveSession = 'leaveSession',
  editSession = 'editSession',
  publishSession = 'publishSession',
  completeSession = 'completeSession',
  deleteSession = 'deleteSession',
  editPlayMemo = 'editPlayMemo',
}

/** @deprecated `ACTION_POLICIES` へ移行する */
export const LEGACY_ACTION_POLICIES: Record<
  LegacyGameSessionAction,
  GameSessionActionPolicy
> = {
  [LegacyGameSessionAction.joinSession]: {
    roles: ['member'],
    statuses: [GameSessionStatus.confirmed, GameSessionStatus.today],
  },
  [LegacyGameSessionAction.leaveSession]: {
    roles: ['member'],
    statuses: [GameSessionStatus.confirmed, GameSessionStatus.today],
  },
  [LegacyGameSessionAction.editSession]: {
    roles: ['host'],
    statuses: [GameSessionStatus.draft, GameSessionStatus.confirmed],
  },
  [LegacyGameSessionAction.publishSession]: {
    roles: ['host'],
    statuses: [GameSessionStatus.draft],
  },
  [LegacyGameSessionAction.completeSession]: {
    roles: ['host'],
    statuses: [GameSessionStatus.today],
  },
  [LegacyGameSessionAction.deleteSession]: {
    roles: ['host'],
    statuses: [GameSessionStatus.draft],
  },
  [LegacyGameSessionAction.editPlayMemo]: {
    roles: ['host', 'member'],
    statuses: [
      GameSessionStatus.draft,
      GameSessionStatus.confirmed,
      GameSessionStatus.today,
    ],
  },
};

/** @deprecated `canPerform` へ移行する */
export function canPerformLegacy(
  action: LegacyGameSessionAction,
  status: GameSessionStatus,
  role: GameSessionRole,
): boolean {
  const { roles, statuses } = LEGACY_ACTION_POLICIES[action];
  return roles.includes(role) && statuses.includes(status);
}
