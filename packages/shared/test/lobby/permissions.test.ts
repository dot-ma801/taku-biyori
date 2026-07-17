import { describe, expect, it } from 'vitest';
import { canPerformLobbyAction, LobbyAction } from '@/lobby/permissions';
import type { LobbyRole } from '@/lobby/permissions';
import { LobbyStatus } from '@/lobby';

const ALL_STATUSES: LobbyStatus[] = Object.values(LobbyStatus);
const ALL_ROLES: LobbyRole[] = ['host', 'member'];

// 期待マトリクス: action → 許可される [role, status] の組み合わせ
// docs/design-v1.1.md「ステータスごとの操作可否」に基づく API 契約
// （UI でのボタン表示はこれより狭めてよいが、契約側は歪めない）
const ALLOWED: Record<LobbyAction, { role: LobbyRole; status: LobbyStatus }[]> =
  {
    [LobbyAction.editLobby]: [
      { role: 'host', status: LobbyStatus.draft },
      { role: 'host', status: LobbyStatus.open },
      { role: 'host', status: LobbyStatus.scheduling },
    ],
    [LobbyAction.publishLobby]: [{ role: 'host', status: LobbyStatus.draft }],
    // API 上は draft からの中止も許可される（design-v1.1 操作可否マトリクス）
    [LobbyAction.cancelLobby]: [
      { role: 'host', status: LobbyStatus.draft },
      { role: 'host', status: LobbyStatus.open },
      { role: 'host', status: LobbyStatus.scheduling },
    ],
  };

describe('canPerformLobbyAction', () => {
  for (const action of Object.values(LobbyAction)) {
    describe(`action: ${action}`, () => {
      for (const role of ALL_ROLES) {
        for (const status of ALL_STATUSES) {
          const expected = ALLOWED[action].some(
            (a) => a.role === role && a.status === status,
          );
          it(`${role} × ${status} → ${expected ? '許可' : '拒否'}`, () => {
            expect(canPerformLobbyAction(action, status, role)).toBe(expected);
          });
        }
      }
    });
  }
});
