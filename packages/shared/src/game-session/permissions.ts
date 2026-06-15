import { GameSessionStatus } from '@/game-session';

export type GameSessionRole = 'host' | 'member';

export enum GameSessionAction {
  /** 参加 */
  joinSession = 'joinSession',
  /** 退出 */
  leaveSession = 'leaveSession',
  /** 日程の回答 */
  inputScheduleResponse = 'inputScheduleResponse',
  /** 候補日の追加 */
  addCandidates = 'addCandidates',
  /** 日程の確定 */
  confirmSchedule = 'confirmSchedule',
  /** 詳細の編集 */
  editSession = 'editSession',
  /** 公開 */
  publishSession = 'publishSession',
  /** 完了 */
  completeSession = 'completeSession',
  /** 削除 */
  deleteSession = 'deleteSession',
}

type ActionPolicy = {
  roles: GameSessionRole[];
  statuses: GameSessionStatus[];
};

const ALL_STATUSES = Object.values(GameSessionStatus);

export const ACTION_POLICIES: Record<GameSessionAction, ActionPolicy> = {
  [GameSessionAction.joinSession]: {
    roles: ['member'],
    statuses: [GameSessionStatus.open],
  },
  [GameSessionAction.leaveSession]: {
    roles: ['member'],
    statuses: [GameSessionStatus.open, GameSessionStatus.scheduling],
  },
  [GameSessionAction.inputScheduleResponse]: {
    roles: ['host', 'member'],
    statuses: [GameSessionStatus.open, GameSessionStatus.scheduling],
  },
  [GameSessionAction.addCandidates]: {
    roles: ['host'],
    statuses: ALL_STATUSES,
  },
  [GameSessionAction.confirmSchedule]: {
    roles: ['host'],
    statuses: [GameSessionStatus.scheduling],
  },
  [GameSessionAction.editSession]: {
    roles: ['host'],
    statuses: [
      GameSessionStatus.draft,
      GameSessionStatus.open,
      GameSessionStatus.scheduling,
    ],
  },
  [GameSessionAction.publishSession]: {
    roles: ['host'],
    statuses: [GameSessionStatus.draft],
  },
  [GameSessionAction.completeSession]: {
    roles: ['host'],
    statuses: [GameSessionStatus.today],
  },
  [GameSessionAction.deleteSession]: {
    roles: ['host'],
    statuses: [GameSessionStatus.draft],
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
