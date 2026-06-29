import { describe, expect, it } from 'vitest';
import { canPerform, GameSessionAction } from '@/game-session/permissions';
import type { GameSessionRole } from '@/game-session/permissions';
import { GameSessionStatus } from '@/game-session';

const ALL_STATUSES: GameSessionStatus[] = Object.values(GameSessionStatus);
const ALL_ROLES: GameSessionRole[] = ['host', 'member'];

// 期待マトリクス: action → 許可される [role, status] の組み合わせ
const ALLOWED: Record<
  GameSessionAction,
  { role: GameSessionRole; status: GameSessionStatus }[]
> = {
  [GameSessionAction.joinSession]: [
    { role: 'member', status: GameSessionStatus.open },
  ],
  [GameSessionAction.leaveSession]: [
    { role: 'member', status: GameSessionStatus.open },
    { role: 'member', status: GameSessionStatus.scheduling },
  ],
  [GameSessionAction.inputScheduleResponse]: [
    { role: 'host', status: GameSessionStatus.open },
    { role: 'host', status: GameSessionStatus.scheduling },
    { role: 'member', status: GameSessionStatus.open },
    { role: 'member', status: GameSessionStatus.scheduling },
  ],
  [GameSessionAction.addCandidates]: ALL_STATUSES.map((status) => ({
    role: 'host' as const,
    status,
  })),
  [GameSessionAction.confirmSchedule]: [
    { role: 'host', status: GameSessionStatus.scheduling },
  ],
  [GameSessionAction.editSession]: [
    { role: 'host', status: GameSessionStatus.draft },
    { role: 'host', status: GameSessionStatus.open },
    { role: 'host', status: GameSessionStatus.scheduling },
  ],
  [GameSessionAction.publishSession]: [
    { role: 'host', status: GameSessionStatus.draft },
  ],
  [GameSessionAction.completeSession]: [
    { role: 'host', status: GameSessionStatus.today },
  ],
  [GameSessionAction.deleteSession]: [
    { role: 'host', status: GameSessionStatus.draft },
    { role: 'host', status: GameSessionStatus.open },
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
