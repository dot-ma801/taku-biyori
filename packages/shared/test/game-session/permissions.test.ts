import { describe, expect, it } from 'vitest';
import { canPerform, GameSessionAction } from '@/game-session/permissions';
import type { GameSessionRole } from '@/game-session/permissions';
import { GameSessionStatus } from '@/game-session';

const ALL_STATUSES: GameSessionStatus[] = Object.values(GameSessionStatus);
const ALL_ROLES: GameSessionRole[] = ['host', 'member'];

// 期待マトリクス: action → 許可される [role, status] の組み合わせ
// 段階6b で募集を募集枠（lobby）へ移したため、卓では open を導出しない。
// open を列挙していたポリシーは confirmed（公開済み・実施前）へ読み替えている。
const ALLOWED: Record<
  GameSessionAction,
  { role: GameSessionRole; status: GameSessionStatus }[]
> = {
  // 参加条件は「公開済み・未完了・実施日当日まで」（design-v1.1 §8）
  [GameSessionAction.joinSession]: [
    { role: 'member', status: GameSessionStatus.confirmed },
    { role: 'member', status: GameSessionStatus.today },
  ],
  [GameSessionAction.leaveSession]: [
    { role: 'member', status: GameSessionStatus.confirmed },
    { role: 'member', status: GameSessionStatus.scheduling },
  ],
  [GameSessionAction.editSession]: [
    { role: 'host', status: GameSessionStatus.draft },
    { role: 'host', status: GameSessionStatus.confirmed },
    { role: 'host', status: GameSessionStatus.scheduling },
  ],
  [GameSessionAction.publishSession]: [
    { role: 'host', status: GameSessionStatus.draft },
  ],
  [GameSessionAction.completeSession]: [
    { role: 'host', status: GameSessionStatus.today },
  ],
  // 確定（scheduled_at 確定 = confirmed 以降）の卓は削除不可。中止が受け皿になる（design-v1.1 §6）
  [GameSessionAction.deleteSession]: [
    { role: 'host', status: GameSessionStatus.draft },
    { role: 'host', status: GameSessionStatus.scheduling },
  ],
};

describe('canPerform', () => {
  for (const action of Object.values(GameSessionAction)) {
    describe(`action: ${action}`, () => {
      for (const role of ALL_ROLES) {
        for (const status of ALL_STATUSES) {
          const expected = ALLOWED[action].some(
            (a) => a.role === role && a.status === status,
          );
          it(`${role} × ${status} → ${expected ? '許可' : '拒否'}`, () => {
            expect(canPerform(action, status, role)).toBe(expected);
          });
        }
      }
    });
  }
});

describe('GameSessionAction', () => {
  // 卓の日程調整 API は段階6b で廃止し、募集枠（lobby）へ一本化した
  it('募集専用アクション（日程回答・候補日追加・日程確定）を持たない', () => {
    // Arrange / Act
    const actions: string[] = Object.values(GameSessionAction);

    // Assert
    expect(actions).not.toContain('inputScheduleResponse');
    expect(actions).not.toContain('addCandidates');
    expect(actions).not.toContain('confirmSchedule');
  });
});
