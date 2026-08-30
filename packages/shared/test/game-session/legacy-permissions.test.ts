import { describe, expect, it } from 'vitest';
import {
  canPerformLegacy,
  LegacyGameSessionAction,
} from '@/game-session/permissions';
import type { GameSessionRole } from '@/game-session/permissions';
import { GameSessionStatus } from '@/game-session';

const ALL_STATUSES: GameSessionStatus[] = Object.values(GameSessionStatus);
const ALL_ROLES: GameSessionRole[] = ['host', 'member'];

// 期待マトリクス: action → 許可される [role, status] の組み合わせ
// 段階6b で募集を募集枠（lobby）へ移したため、卓では open を導出しない。
// open を列挙していたポリシーは confirmed（公開済み・実施前）へ読み替えている。
const ALLOWED: Record<
  LegacyGameSessionAction,
  { role: GameSessionRole; status: GameSessionStatus }[]
> = {
  // 参加条件は「公開済み・未完了・実施日当日まで」（design-v1.1 §8）
  [LegacyGameSessionAction.joinSession]: [
    { role: 'member', status: GameSessionStatus.confirmed },
    { role: 'member', status: GameSessionStatus.today },
  ],
  // 退出条件は参加条件と対称に保つ（当日参加したユーザーが同日中に退出できるよう today を含める）
  [LegacyGameSessionAction.leaveSession]: [
    { role: 'member', status: GameSessionStatus.confirmed },
    { role: 'member', status: GameSessionStatus.today },
    { role: 'member', status: GameSessionStatus.scheduling },
  ],
  [LegacyGameSessionAction.editSession]: [
    { role: 'host', status: GameSessionStatus.draft },
    { role: 'host', status: GameSessionStatus.confirmed },
    { role: 'host', status: GameSessionStatus.scheduling },
  ],
  [LegacyGameSessionAction.publishSession]: [
    { role: 'host', status: GameSessionStatus.draft },
  ],
  [LegacyGameSessionAction.completeSession]: [
    { role: 'host', status: GameSessionStatus.today },
  ],
  // 確定（scheduled_at 確定 = confirmed 以降）の卓は削除不可。中止が受け皿になる（design-v1.1 §6）
  [LegacyGameSessionAction.deleteSession]: [
    { role: 'host', status: GameSessionStatus.draft },
    { role: 'host', status: GameSessionStatus.scheduling },
  ],
  // プレイメモの本文編集。ホストもプレイヤーとして自分のメモを持つため両ロールを許可し、
  // 終端状態（完了・中止）では編集できない（design-v1.2 §4）
  [LegacyGameSessionAction.editPlayMemo]: [
    { role: 'host', status: GameSessionStatus.draft },
    { role: 'host', status: GameSessionStatus.confirmed },
    { role: 'host', status: GameSessionStatus.today },
    { role: 'member', status: GameSessionStatus.draft },
    { role: 'member', status: GameSessionStatus.confirmed },
    { role: 'member', status: GameSessionStatus.today },
  ],
};

describe('canPerformLegacy', () => {
  for (const action of Object.values(LegacyGameSessionAction)) {
    describe(`action: ${action}`, () => {
      for (const role of ALL_ROLES) {
        for (const status of ALL_STATUSES) {
          const expected = ALLOWED[action].some(
            (a) => a.role === role && a.status === status,
          );
          it(`${role} × ${status} → ${expected ? '許可' : '拒否'}`, () => {
            expect(canPerformLegacy(action, status, role)).toBe(expected);
          });
        }
      }
    });
  }
});

describe('leaveSession と joinSession の対称性', () => {
  // 参加できるステータスでは必ず退出もできる必要がある。
  // 当日（today）に参加したユーザーがその日のうちに退出できなくなる非対称を防ぐ。
  it.each(ALL_STATUSES)('%s で参加できるなら退出もできる', (status) => {
    // Arrange
    const canJoin = canPerformLegacy(
      LegacyGameSessionAction.joinSession,
      status,
      'member',
    );

    // Act
    const canLeave = canPerformLegacy(
      LegacyGameSessionAction.leaveSession,
      status,
      'member',
    );

    // Assert
    if (canJoin) expect(canLeave).toBe(true);
  });

  it('today のメンバーは退出できる', () => {
    // Arrange / Act
    const result = canPerformLegacy(
      LegacyGameSessionAction.leaveSession,
      GameSessionStatus.today,
      'member',
    );

    // Assert
    expect(result).toBe(true);
  });
});

describe('LegacyGameSessionAction', () => {
  // 卓の日程調整 API は段階6b で廃止し、募集枠（lobby）へ一本化した
  it('募集専用アクション（日程回答・候補日追加・日程確定）を持たない', () => {
    // Arrange / Act
    const actions: string[] = Object.values(LegacyGameSessionAction);

    // Assert
    expect(actions).not.toContain('inputScheduleResponse');
    expect(actions).not.toContain('addCandidates');
    expect(actions).not.toContain('confirmSchedule');
  });
});
