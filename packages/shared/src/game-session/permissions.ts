import { GameSessionStatus } from '@/game-session/status';

export type GameSessionRole = 'host' | 'member';

export enum GameSessionAction {
  /** 参加 */
  joinSession = 'joinSession',
  /** 退出 */
  leaveSession = 'leaveSession',
  /** 詳細の編集 */
  editSession = 'editSession',
  /** 公開 */
  publishSession = 'publishSession',
  /** 完了 */
  completeSession = 'completeSession',
  /** 削除 */
  deleteSession = 'deleteSession',
  /** プレイメモの本文編集 */
  editPlayMemo = 'editPlayMemo',
}

type ActionPolicy = {
  roles: GameSessionRole[];
  statuses: GameSessionStatus[];
};

/**
 * 卓の操作可否（API 契約）。フロントの表示制御とバックエンドのバリデーションで同じ表を使う。
 *
 * 段階6b で募集・日程調整を募集枠（lobby）へ移したため、卓では `open` を導出しない
 * （`open` は公開遷移 `draft → open` のリクエスト値としてのみ残る）。
 * 旧ポリシーが `open`（公開済み・募集中）を列挙していた箇所は
 * `confirmed`（公開済み・実施前）へ読み替えている。
 * 段階6c で `scheduled_at` を NOT NULL 化したため `scheduling` も導出されなくなり、
 * フォールバックとして列挙していた箇所は取り除いた。
 */
export const ACTION_POLICIES: Record<GameSessionAction, ActionPolicy> = {
  // 参加条件は「公開済み・未完了・実施日当日まで」（design-v1.1 §8）
  [GameSessionAction.joinSession]: {
    roles: ['member'],
    statuses: [GameSessionStatus.confirmed, GameSessionStatus.today],
  },
  // 退出条件は参加条件と対称に保つ。`today` を含めないと
  // 当日参加したユーザーがその日のうちに退出できなくなる
  [GameSessionAction.leaveSession]: {
    roles: ['member'],
    statuses: [GameSessionStatus.confirmed, GameSessionStatus.today],
  },
  [GameSessionAction.editSession]: {
    roles: ['host'],
    statuses: [GameSessionStatus.draft, GameSessionStatus.confirmed],
  },
  [GameSessionAction.publishSession]: {
    roles: ['host'],
    statuses: [GameSessionStatus.draft],
  },
  [GameSessionAction.completeSession]: {
    roles: ['host'],
    statuses: [GameSessionStatus.today],
  },
  // 日程が確定した卓（confirmed 以降）は削除不可。「やめたい」の受け皿は中止（design-v1.1 §6）
  [GameSessionAction.deleteSession]: {
    roles: ['host'],
    statuses: [GameSessionStatus.draft],
  },
  // ホストもプレイヤーとして自分のメモを持つため両ロールを許可する。
  // 「本人のメモであること」はロールでは表現できないため別途検証する（design-v1.2 §4）
  [GameSessionAction.editPlayMemo]: {
    roles: ['host', 'member'],
    statuses: [
      GameSessionStatus.draft,
      GameSessionStatus.confirmed,
      GameSessionStatus.today,
    ],
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
