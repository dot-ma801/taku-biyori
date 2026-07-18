import { LobbyStatus } from '@/lobby/status';

export type LobbyRole = 'host' | 'member';

// game-session/permissions.ts の ACTION_POLICIES / canPerform パターンを踏襲。
// エクスポート名の衝突を避けるため Lobby プレフィックスを付ける。
// テーブルは docs/design-v1.1.md「ステータスごとの操作可否」の API 契約を表す。
// join/leave 等のアクションは必要になったタイミングで追加する。
export enum LobbyAction {
  /** 募集枠の編集 */
  editLobby = 'editLobby',
  /** 公開 */
  publishLobby = 'publishLobby',
  /** 募集中止 */
  cancelLobby = 'cancelLobby',
}

type LobbyActionPolicy = {
  roles: LobbyRole[];
  statuses: LobbyStatus[];
};

export const LOBBY_ACTION_POLICIES: Record<LobbyAction, LobbyActionPolicy> = {
  [LobbyAction.editLobby]: {
    roles: ['host'],
    statuses: [LobbyStatus.draft, LobbyStatus.open, LobbyStatus.scheduling],
  },
  [LobbyAction.publishLobby]: {
    roles: ['host'],
    statuses: [LobbyStatus.draft],
  },
  [LobbyAction.cancelLobby]: {
    roles: ['host'],
    statuses: [LobbyStatus.draft, LobbyStatus.open, LobbyStatus.scheduling],
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
