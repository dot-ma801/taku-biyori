import { describe, expect, it } from 'vitest';
import { canPerform, ACTION_POLICIES } from '@/game-session/permissions';
import type {
  GameSessionAction,
  GameSessionRole,
} from '@/game-session/permissions';
import type { GameSessionStatus } from '@/game-session';

// すべてのステータス・ロール・アクション
const ALL_STATUSES: GameSessionStatus[] = [
  'draft',
  'open',
  'scheduling',
  'confirmed',
  'today',
  'completed',
];
const ALL_ROLES: GameSessionRole[] = ['host', 'member'];
const ALL_ACTIONS = Object.keys(ACTION_POLICIES) as GameSessionAction[];

// 期待マトリクス: action → 許可される [role, status] の組み合わせ
const ALLOWED: Record<
  GameSessionAction,
  { role: GameSessionRole; status: GameSessionStatus }[]
> = {
  leaveSession: [
    { role: 'member', status: 'open' },
    { role: 'member', status: 'scheduling' },
  ],
  joinSession: [{ role: 'member', status: 'open' }],
  inputScheduleResponse: [
    { role: 'host', status: 'open' },
    { role: 'host', status: 'scheduling' },
    { role: 'member', status: 'open' },
    { role: 'member', status: 'scheduling' },
  ],
  addCandidates: ALL_STATUSES.map((status) => ({
    role: 'host' as const,
    status,
  })),
  confirmSchedule: [{ role: 'host', status: 'scheduling' }],
  editSession: [
    { role: 'host', status: 'draft' },
    { role: 'host', status: 'open' },
    { role: 'host', status: 'scheduling' },
  ],
  publishSession: [{ role: 'host', status: 'draft' }],
  completeSession: [{ role: 'host', status: 'today' }],
  deleteSession: [{ role: 'host', status: 'draft' }],
};

describe('canPerform', () => {
  for (const action of ALL_ACTIONS) {
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
