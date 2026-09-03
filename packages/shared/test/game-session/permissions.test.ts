import { describe, expect, it } from 'vitest';
import { canPerform, GameSessionAction } from '@/game-session/permissions';
import type { GameSessionRole } from '@/game-session/permissions';
import { GameSessionStatus } from '@/game-session';

const DERIVED_STATUSES: GameSessionStatus[] = [
  GameSessionStatus.scheduled,
  GameSessionStatus.today,
  GameSessionStatus.completed,
  GameSessionStatus.cancelled,
];
const ALL_ROLES: GameSessionRole[] = ['host', 'member'];

const on = (
  roles: readonly GameSessionRole[],
  statuses: readonly GameSessionStatus[],
): { role: GameSessionRole; status: GameSessionStatus }[] =>
  roles.flatMap((role) => statuses.map((status) => ({ role, status })));

const BEFORE_END = [
  GameSessionStatus.scheduled,
  GameSessionStatus.today,
] as const;
const NOT_CANCELLED = [
  GameSessionStatus.scheduled,
  GameSessionStatus.today,
  GameSessionStatus.completed,
] as const;

// 期待マトリクス: action → 許可される [role, status] の組み合わせ。
// docs/design-v2.md §4-3「操作可否」の表をそのまま写したもの
// （UI でのボタン表示はこれより狭めてよいが、契約側は歪めない）
const ALLOWED: Record<
  GameSessionAction,
  { role: GameSessionRole; status: GameSessionStatus }[]
> = {
  [GameSessionAction.editGameSession]: on(['host'], NOT_CANCELLED),
  [GameSessionAction.completeGameSession]: on(['host'], BEFORE_END),
  [GameSessionAction.cancelGameSession]: on(['host'], BEFORE_END),
  // 「または着席者がホスト本人のみ」は件数条件なので表には入らない（§4-5）
  [GameSessionAction.deleteGameSession]: on(
    ['host'],
    [GameSessionStatus.cancelled],
  ),
  // 着席させられるのはホストだけ（§6-6）
  [GameSessionAction.seatEntry]: on(['host'], BEFORE_END),
  // 「本人またはホスト」の本人性は use case 側で判定する
  [GameSessionAction.unseat]: on(['host', 'member'], BEFORE_END),
  // 完了後にキャラ名を埋める運用があるため completed でも許可する
  [GameSessionAction.assignCharacter]: on(['host', 'member'], NOT_CANCELLED),
  [GameSessionAction.editSeatPlayMemo]: on(['host', 'member'], BEFORE_END),
  // 公開切替は本文の保存と違いステータス非依存（常時）
  [GameSessionAction.toggleSeatPlayMemoVisibility]: on(
    ['host', 'member'],
    DERIVED_STATUSES,
  ),
  [GameSessionAction.viewSharedSeatPlayMemos]: on(
    ['host', 'member'],
    [GameSessionStatus.completed, GameSessionStatus.cancelled],
  ),
};

describe('canPerform', () => {
  for (const action of Object.values(GameSessionAction)) {
    describe(`action: ${action}`, () => {
      for (const role of ALL_ROLES) {
        for (const status of DERIVED_STATUSES) {
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

describe('v2 のポリシー表', () => {
  // v0.2 の draft / open / confirmed は enum ごと消えたため、
  // 「廃止したステータスでは何も許可しない」は型で担保される（ここでは検証しない）

  it('中止した開催は編集も完了もできない（記録として凍結する）', () => {
    // Arrange
    const status = GameSessionStatus.cancelled;

    // Act / Assert
    expect(canPerform(GameSessionAction.editGameSession, status, 'host')).toBe(
      false,
    );
    expect(
      canPerform(GameSessionAction.completeGameSession, status, 'host'),
    ).toBe(false);
  });

  it('完了と中止は同じ条件で許可する（どちらも scheduled / today から）', () => {
    // Arrange / Act
    const complete = DERIVED_STATUSES.filter((status) =>
      canPerform(GameSessionAction.completeGameSession, status, 'host'),
    );
    const cancel = DERIVED_STATUSES.filter((status) =>
      canPerform(GameSessionAction.cancelGameSession, status, 'host'),
    );

    // Assert
    expect(cancel).toEqual(complete);
  });

  it('着席させられるのはホストだけで、参加者は自分で着席できない（§6-6）', () => {
    // Arrange / Act
    const memberCanSeat = DERIVED_STATUSES.some((status) =>
      canPerform(GameSessionAction.seatEntry, status, 'member'),
    );

    // Assert
    expect(memberCanSeat).toBe(false);
  });

  it('公開メモを読めるのは終わった開催だけ', () => {
    // Arrange / Act
    const readable = DERIVED_STATUSES.filter((status) =>
      canPerform(GameSessionAction.viewSharedSeatPlayMemos, status, 'member'),
    );

    // Assert
    expect(readable).toEqual([
      GameSessionStatus.completed,
      GameSessionStatus.cancelled,
    ]);
  });

  it('公開・募集に関するアクションを持たない（ロビーの関心事へ移った）', () => {
    // Arrange / Act
    const actions: string[] = Object.values(GameSessionAction);

    // Assert
    expect(actions).not.toContain('publishSession');
    expect(actions).not.toContain('joinSession');
  });
});
