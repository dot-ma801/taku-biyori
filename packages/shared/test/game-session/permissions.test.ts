import { describe, expect, it } from 'vitest';
import {
  canPerform,
  ACTION_POLICIES,
  GameSessionAction,
} from '@/game-session/permissions';
import type { GameSessionRole } from '@/game-session/permissions';
import type { GameSessionStatus } from '@/game-session';

const ALL_STATUSES: GameSessionStatus[] = [
  'draft',
  'open',
  'scheduling',
  'confirmed',
  'today',
  'completed',
];
const ALL_ROLES: GameSessionRole[] = ['host', 'member'];
const ALL_ACTIONS = Object.values(
  ACTION_POLICIES,
) as unknown as GameSessionAction[];

// 期待マトリクス: action → 許可される [role, status] の組み合わせ
const ALLOWED: Record<
  GameSessionAction,
  { role: GameSessionRole; status: GameSessionStatus }[]
> = {
  [GameSessionAction.joinSession]: [{ role: 'member', status: 'open' }],
  [GameSessionAction.leaveSession]: [
    { role: 'member', status: 'open' },
    { role: 'member', status: 'scheduling' },
  ],
  [GameSessionAction.inputScheduleResponse]: [
    { role: 'host', status: 'open' },
    { role: 'host', status: 'scheduling' },
    { role: 'member', status: 'open' },
    { role: 'member', status: 'scheduling' },
  ],
  [GameSessionAction.addCandidates]: ALL_STATUSES.map((status) => ({
    role: 'host' as const,
    status,
  })),
  [GameSessionAction.confirmSchedule]: [{ role: 'host', status: 'scheduling' }],
  [GameSessionAction.editSession]: [
    { role: 'host', status: 'draft' },
    { role: 'host', status: 'open' },
    { role: 'host', status: 'scheduling' },
  ],
  [GameSessionAction.publishSession]: [{ role: 'host', status: 'draft' }],
  [GameSessionAction.completeSession]: [{ role: 'host', status: 'today' }],
  [GameSessionAction.deleteSession]: [{ role: 'host', status: 'draft' }],
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
