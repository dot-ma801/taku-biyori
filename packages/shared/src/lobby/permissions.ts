import { LobbyStatus } from '@/lobby/status';

export type LobbyRole = 'host' | 'member' | 'guest';

// game-session/permissions.ts の ACTION_POLICIES / canPerform パターンを踏襲。
// エクスポート名の衝突を避けるため Lobby プレフィックスを付ける。
// テーブルは docs/design-v2.md §4-3「操作可否」の API 契約を表す。
export enum LobbyAction {
  /** ロビーの編集 */
  editLobby = 'editLobby',
  /** 公開（draft → open） */
  publishLobby = 'publishLobby',
  /** 受付を閉じる */
  closeReception = 'closeReception',
  /** 追加募集（受付を開き直す） */
  reopenReception = 'reopenReception',
  /** 解散 */
  disbandLobby = 'disbandLobby',
  /** 削除 */
  deleteLobby = 'deleteLobby',
  /** 招待トークンの再発行 */
  regenerateGuestLink = 'regenerateGuestLink',
  /** ロビーへの参加 */
  joinLobby = 'joinLobby',
  /** ロビーからの脱退 */
  leaveLobby = 'leaveLobby',
  /** 日程調整を始める */
  startSchedulePoll = 'startSchedulePoll',
  /** 候補日の編集 */
  editCandidateDates = 'editCandidateDates',
  /** ◯△×の回答 */
  answerSchedule = 'answerSchedule',
  /** セッションを開く */
  openGameSession = 'openGameSession',
}

type LobbyActionPolicy = {
  roles: LobbyRole[];
  statuses: LobbyStatus[];
};

// 「disbanded 以外」を表す3ステータス。disbanded は終端で、どのアクションも許可しない（§4-4）
const NOT_DISBANDED: LobbyStatus[] = [
  LobbyStatus.draft,
  LobbyStatus.open,
  LobbyStatus.closed,
];

// 公開済みであること（draft を除く）を表す2ステータス
const PUBLISHED: LobbyStatus[] = [LobbyStatus.open, LobbyStatus.closed];

/**
 * ロビーの操作可否（API 契約）。フロントの表示制御とバックエンドのバリデーションで同じ表を使う。
 *
 * **ロールとステータスの2軸で決まらない条件はこの表に入れない**（design-v2 §4-5）。
 * 件数（削除の「他の参加者なし・セッション0件」）、最新かどうか（候補日の編集・回答）、
 * 本人性（脱退が本人 or ホストか）は use case 側で判定する。
 */
export const LOBBY_ACTION_POLICIES: Record<LobbyAction, LobbyActionPolicy> = {
  [LobbyAction.editLobby]: {
    roles: ['host'],
    statuses: NOT_DISBANDED,
  },
  [LobbyAction.publishLobby]: {
    roles: ['host'],
    statuses: [LobbyStatus.draft],
  },
  [LobbyAction.closeReception]: {
    roles: ['host'],
    statuses: [LobbyStatus.open],
  },
  [LobbyAction.reopenReception]: {
    roles: ['host'],
    statuses: [LobbyStatus.closed],
  },
  [LobbyAction.disbandLobby]: {
    roles: ['host'],
    statuses: NOT_DISBANDED,
  },
  // 「他の参加者なし・セッション0件」は件数条件のため use case 側で判定する
  [LobbyAction.deleteLobby]: {
    roles: ['host'],
    statuses: [LobbyStatus.draft],
  },
  // §6-12-1: GET / POST（再発行）とも「ホスト・disbanded 以外」で判定してよい
  [LobbyAction.regenerateGuestLink]: {
    roles: ['host'],
    statuses: NOT_DISBANDED,
  },
  // ホストは作成時に自動で LobbyEntry を持つため、参加アクションの対象外
  [LobbyAction.joinLobby]: {
    roles: ['member', 'guest'],
    statuses: [LobbyStatus.open],
  },
  // 「本人 or ホスト」「ホスト自身の参加は脱退不可」は本人性の条件のため use case 側で判定する
  [LobbyAction.leaveLobby]: {
    roles: ['host', 'member', 'guest'],
    statuses: NOT_DISBANDED,
  },
  [LobbyAction.startSchedulePoll]: {
    roles: ['host'],
    statuses: NOT_DISBANDED,
  },
  // 「最新の調整のみ」は use case 側で判定する
  [LobbyAction.editCandidateDates]: {
    roles: ['host'],
    statuses: NOT_DISBANDED,
  },
  // 受付が閉じていても、すでに参加している人は回答できる（閉じるのは入口だけ）。
  // 未公開（draft）のロビーには参加者がいないため除外する
  [LobbyAction.answerSchedule]: {
    roles: ['member', 'guest'],
    statuses: PUBLISHED,
  },
  [LobbyAction.openGameSession]: {
    roles: ['host'],
    statuses: NOT_DISBANDED,
  },
};

export function canPerformLobbyAction(
  action: LobbyAction,
  status: LobbyStatus,
  role: LobbyRole,
): boolean {
  const { roles, statuses } = LOBBY_ACTION_POLICIES[action];
  return roles.includes(role) && statuses.includes(status);
}
