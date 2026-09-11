import {
  LobbyAction,
  LobbyStatus,
  canPerformLobbyAction,
  getLobbyStatus,
  todayDateString,
  type Lobby,
  type LobbyStatusFacts,
  type UpdateLobbyStatusInput,
} from '@taku-biyori/shared';
import type { LobbyHostRepository } from '@/lobby/application/lobby-host-repository';

export interface UpdateLobbyStatusRepository extends LobbyHostRepository {
  findStatusFields(id: string): Promise<LobbyStatusFacts | null>;
  /** 冪等な遷移（すでにその状態）で現在のロビーをそのまま返すために使う */
  findLobbyById(id: string): Promise<Lobby | null>;
  /** `published_at` をセットして下書きを抜ける */
  publish(id: string): Promise<Lobby | null>;
  /** `reception_closed_at` をセットして受付を閉じる */
  closeReception(id: string): Promise<Lobby | null>;
  /** `reception_closed_at` をクリアして追加募集する */
  reopenReception(id: string): Promise<Lobby | null>;
  /** `disbanded_at` をセットして解散する */
  disband(id: string): Promise<Lobby | null>;
}

export type UpdateLobbyStatusResult =
  | { type: 'ok'; lobby: Lobby }
  | { type: 'notFound' }
  | { type: 'forbidden' }
  | { type: 'invalidTransition' };

/**
 * ロビーのステータスを遷移させる（design-v2 §6-13-2）。
 * target は「今どうしたいか」の意図であり、現在のステータスそのものではない。
 *
 * | target | 書き込むファクト | 許可する現ステータス |
 * |---|---|---|
 * | `open` | `published_at`（draft から）／`reception_closed_at` のクリア（closed から） | draft / open / closed |
 * | `closed` | `reception_closed_at = now()` | open |
 * | `disbanded` | `disbanded_at = now()` | draft / open / closed |
 *
 * 同じ状態への遷移は冪等に成功させる（`open` → `open` は 200）。
 * `disbanded` からの遷移はすべて拒否する（終端状態。design-v2 §4-4）。
 */
export const updateLobbyStatus = async (
  repo: UpdateLobbyStatusRepository,
  id: string,
  userId: string,
  input: UpdateLobbyStatusInput,
  today: string = todayDateString(),
): Promise<UpdateLobbyStatusResult> => {
  const hostUserId = await repo.findHostUserId(id);
  if (hostUserId === null) return { type: 'notFound' };
  if (hostUserId !== userId) return { type: 'forbidden' };

  const fields = await repo.findStatusFields(id);
  if (!fields) return { type: 'notFound' };

  const currentStatus = getLobbyStatus(fields, today);

  // 条件付き UPDATE が 0 行（null）だったとき、行が残っているなら
  // 並行する遷移に先を越されたケースなので invalidTransition、
  // 行ごと消えているなら notFound を返す。
  const resolveZeroRowUpdate = async (): Promise<UpdateLobbyStatusResult> => {
    const stillExists = (await repo.findHostUserId(id)) !== null;
    return stillExists ? { type: 'invalidTransition' } : { type: 'notFound' };
  };

  const can = (action: LobbyAction): boolean =>
    canPerformLobbyAction(action, currentStatus, 'host');

  if (input.status === 'open') {
    // draft からは公開、closed からは追加募集。すでに open なら何もせず現状を返す
    if (currentStatus === LobbyStatus.open) {
      const lobby = await repo.findLobbyById(id);
      return lobby ? { type: 'ok', lobby } : { type: 'notFound' };
    }
    if (can(LobbyAction.publishLobby)) {
      const lobby = await repo.publish(id);
      if (!lobby) return resolveZeroRowUpdate();
      return { type: 'ok', lobby };
    }
    if (can(LobbyAction.reopenReception)) {
      const lobby = await repo.reopenReception(id);
      if (!lobby) return resolveZeroRowUpdate();
      return { type: 'ok', lobby };
    }
    return { type: 'invalidTransition' };
  }

  if (input.status === 'closed') {
    if (currentStatus === LobbyStatus.closed) {
      const lobby = await repo.findLobbyById(id);
      return lobby ? { type: 'ok', lobby } : { type: 'notFound' };
    }
    if (!can(LobbyAction.closeReception)) return { type: 'invalidTransition' };
    const lobby = await repo.closeReception(id);
    if (!lobby) return resolveZeroRowUpdate();
    return { type: 'ok', lobby };
  }

  if (!can(LobbyAction.disbandLobby)) return { type: 'invalidTransition' };
  const lobby = await repo.disband(id);
  if (!lobby) return resolveZeroRowUpdate();
  return { type: 'ok', lobby };
};
