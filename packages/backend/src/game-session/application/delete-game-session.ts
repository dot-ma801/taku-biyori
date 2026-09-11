import type { GameSessionStatusFacts } from '@taku-biyori/shared';
import {
  GameSessionAction,
  canPerform,
  getGameSessionStatus,
} from '@taku-biyori/shared';

export interface DeleteGameSessionRepository {
  findLobbyId(id: string): Promise<string | null>;
  findHostUserId(id: string): Promise<string | null>;
  findStatusFields(id: string): Promise<GameSessionStatusFacts | null>;
  /** ホスト以外の着席者数。ゲストの着席は user_id が NULL なのでここに数える */
  countOtherSeats(id: string, hostUserId: string): Promise<number>;
  deleteById(id: string): Promise<void>;
  /**
   * 対象セッション行に排他ロックを取り、コールバック内のクエリを1トランザクションで実行する。
   * 「条件チェック → 削除」を別クエリに分けると、その間に着席や状態変更が入った場合に
   * 古い読み取りを根拠に削除してしまう（TOCTOU）。
   */
  executeWithLock<T>(
    id: string,
    fn: (lockedRepo: DeleteGameSessionRepository) => Promise<T>,
  ): Promise<T>;
}

export type DeleteGameSessionResult =
  | { type: 'ok' }
  | { type: 'notFound' }
  | { type: 'forbidden' }
  | { type: 'hasSeat' };

/**
 * セッションを削除する（design-v2 §6-5）。
 *
 * 削除できるのは「`cancelled`」**または**「着席者がホスト本人のみ」のとき（§4-3）。
 * 前半はステータス条件なのでポリシー表が持ち、後半は件数条件なのでここで判定する（§4-5）。
 *
 * 中止した開催は通常「中止」として残すため、削除は間違って作った開催の後始末に使う。
 */
export const deleteGameSession = async (
  repo: DeleteGameSessionRepository,
  lobbyId: string,
  id: string,
  userId: string,
): Promise<DeleteGameSessionResult> => {
  return repo.executeWithLock(id, async (locked) => {
    const actualLobbyId = await locked.findLobbyId(id);
    if (actualLobbyId === null) return { type: 'notFound' };
    if (actualLobbyId !== lobbyId) return { type: 'notFound' };

    const hostUserId = await locked.findHostUserId(id);
    if (hostUserId !== userId) return { type: 'forbidden' };

    const facts = await locked.findStatusFields(id);
    if (!facts) return { type: 'notFound' };

    const status = getGameSessionStatus(facts);
    const deletableByStatus = canPerform(
      GameSessionAction.deleteGameSession,
      status,
      'host',
    );

    if (!deletableByStatus) {
      const otherSeats = await locked.countOtherSeats(id, hostUserId);
      if (otherSeats > 0) return { type: 'hasSeat' };
    }

    await locked.deleteById(id);
    return { type: 'ok' };
  });
};
