import type {
  CreateGameSessionInput,
  GameSession,
  LobbyStatus,
} from '@taku-biyori/shared';
import {
  LobbyAction,
  canPerformLobbyAction,
} from '@taku-biyori/shared';

export interface CreateGameSessionRepository {
  findLobbyForHost(
    lobbyId: string,
  ): Promise<{ hostUserId: string; status: LobbyStatus } | null>;
  /** そのロビーに在籍中（left_at IS NULL）の LobbyEntry だけを返す */
  findActiveEntryIds(lobbyId: string, entryIds: string[]): Promise<string[]>;
  createGameSession(params: {
    lobbyId: string;
    scheduledAt: string;
    entryIds: string[];
    title?: string | null;
    scenarioName?: string | null;
    description?: string | null;
    location?: string | null;
    timeLabel?: string | null;
  }): Promise<GameSession>;
  executeWithLobbyLock<T>(
    lobbyId: string,
    entryIds: string[],
    fn: (lockedRepo: CreateGameSessionRepository) => Promise<T>,
  ): Promise<T>;
}

export type CreateGameSessionResult =
  | { type: 'ok'; gameSession: GameSession }
  | { type: 'notFound' }
  | { type: 'forbidden' }
  | { type: 'invalidStatus' }
  | { type: 'invalidEntries' };

/**
 * セッションを開く（design-v2 §5-2）。v0.2 の「卓確定」の後継。
 *
 * v0.2 との違いは意味の方が大きい。候補日 ID ではなく `scheduledAt` を直接受け取り
 * （開催日の決定は候補日のコピーではなく新しいファクト）、ロビーの title などを
 * セッションへコピーせず、ロビーを閉じもしない。同じロビーに複数の開催があってよいので
 * 二重確定の排除も要らない。
 *
 * 検証と INSERT はロックの内側で行う。ロビー行を `FOR UPDATE`、着席させる
 * LobbyEntry を `FOR KEY SHARE` で押さえ、検証してから INSERT するまでの間に
 * 脱退が入り込まないようにする。
 */
export const createGameSession = async (
  repo: CreateGameSessionRepository,
  lobbyId: string,
  userId: string,
  input: CreateGameSessionInput,
): Promise<CreateGameSessionResult> => {
  // 重複を除いてからロックを取る。同じ entry を2回渡されても着席は1つ
  const entryIds = [...new Set(input.entryIds)];

  return repo.executeWithLobbyLock(lobbyId, entryIds, async (locked) => {
    const lobby = await locked.findLobbyForHost(lobbyId);
    if (!lobby) return { type: 'notFound' };
    if (lobby.hostUserId !== userId) return { type: 'forbidden' };

    // 「セッションを開く」の可否はロビー側のポリシー表が持つ（design-v2 §4-3）。
    // 受付が閉じていても開催は作れる。受付と開催は独立した関心事
    if (
      !canPerformLobbyAction(LobbyAction.openGameSession, lobby.status, 'host')
    ) {
      return { type: 'invalidStatus' };
    }

    // このロビーのものでない ID と、脱退済みの ID をまとめて弾く。
    // DB 制約では表現できない不変条件なのでここで検証する（design-v2 §3-8）
    const activeEntryIds = await locked.findActiveEntryIds(lobbyId, entryIds);
    if (activeEntryIds.length !== entryIds.length) {
      return { type: 'invalidEntries' };
    }

    const gameSession = await locked.createGameSession({
      lobbyId,
      scheduledAt: input.scheduledAt,
      entryIds,
      // 渡されなかった項目は undefined のまま。既定値をコピーすると
      // 以後ロビーを改名しても追随しなくなる（design-v2 §5-5）
      title: input.title,
      scenarioName: input.scenarioName,
      description: input.description,
      location: input.location,
      timeLabel: input.timeLabel,
    });

    return { type: 'ok', gameSession };
  });
};
