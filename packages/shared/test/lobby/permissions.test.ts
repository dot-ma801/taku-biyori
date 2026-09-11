import { describe, expect, it } from 'vitest';
import { canPerformLobbyAction, LobbyAction } from '@/lobby/permissions';
import type { LobbyRole } from '@/lobby/permissions';
import { LobbyStatus } from '@/lobby';

const ALL_STATUSES: LobbyStatus[] = Object.values(LobbyStatus);
const ALL_ROLES: LobbyRole[] = ['host', 'member', 'guest'];

// v2 で導出されるステータスは4つ（design-v2 §4-1）。
// 移行期間中の enum には旧値（scheduling / cancelled）も残るが、どのアクションも許可しない。
const NOT_DISBANDED = [
  LobbyStatus.draft,
  LobbyStatus.open,
  LobbyStatus.closed,
] as const;

// 期待マトリクス: action → 許可される [role, status] の組み合わせ
// docs/design-v2.md §4-3「操作可否」の表をそのまま写したもの
// （UI でのボタン表示はこれより狭めてよいが、契約側は歪めない）
const hostOn = (
  statuses: readonly LobbyStatus[],
): { role: LobbyRole; status: LobbyStatus }[] =>
  statuses.map((status) => ({ role: 'host' as const, status }));

const ALLOWED: Record<LobbyAction, { role: LobbyRole; status: LobbyStatus }[]> =
  {
    [LobbyAction.editLobby]: hostOn(NOT_DISBANDED),
    [LobbyAction.publishLobby]: [{ role: 'host', status: LobbyStatus.draft }],
    [LobbyAction.closeReception]: [{ role: 'host', status: LobbyStatus.open }],
    [LobbyAction.reopenReception]: [
      { role: 'host', status: LobbyStatus.closed },
    ],
    [LobbyAction.disbandLobby]: hostOn(NOT_DISBANDED),
    // 件数条件（他の参加者なし・セッション0件）はロールとステータスの2軸で表せないため
    // ポリシー表には入れず use case 側で判定する（design-v2 §4-5）
    [LobbyAction.deleteLobby]: [{ role: 'host', status: LobbyStatus.draft }],
    [LobbyAction.regenerateGuestLink]: hostOn(NOT_DISBANDED),
    [LobbyAction.joinLobby]: [
      { role: 'member', status: LobbyStatus.open },
      { role: 'guest', status: LobbyStatus.open },
    ],
    // 本人性（本人 or ホスト）はロールでは表せないため use case 側で判定する
    [LobbyAction.leaveLobby]: [
      ...hostOn(NOT_DISBANDED),
      ...NOT_DISBANDED.map((status) => ({ role: 'member' as const, status })),
      ...NOT_DISBANDED.map((status) => ({ role: 'guest' as const, status })),
    ],
    [LobbyAction.startSchedulePoll]: hostOn(NOT_DISBANDED),
    // 「最新の調整のみ」は use case 側の判定
    [LobbyAction.editCandidateDates]: hostOn(NOT_DISBANDED),
    // 「公開済みであること」は draft を除外することで表せる
    [LobbyAction.answerSchedule]: [
      { role: 'member', status: LobbyStatus.open },
      { role: 'member', status: LobbyStatus.closed },
      { role: 'guest', status: LobbyStatus.open },
      { role: 'guest', status: LobbyStatus.closed },
    ],
    [LobbyAction.openGameSession]: hostOn(NOT_DISBANDED),
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

  it('disbanded ではどのアクションも許可されない（終端状態）', () => {
    // Arrange / Act / Assert
    for (const action of Object.values(LobbyAction)) {
      for (const role of ALL_ROLES) {
        expect(canPerformLobbyAction(action, LobbyStatus.disbanded, role)).toBe(
          false,
        );
      }
    }
  });
});
