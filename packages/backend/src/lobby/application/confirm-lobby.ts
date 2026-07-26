import { randomBytes } from 'node:crypto';
import type { ConfirmLobbyInput, GameSession } from '@taku-biyori/shared';
import { LobbyStatus } from '@taku-biyori/shared';
import type { LobbyHostRepository } from '@/lobby/application/lobby-host-repository';
import type { LobbyStatusInput } from '@/lobby/domain/lobby-status';
import { getLobbyStatus } from '@/lobby/domain/lobby-status';

export type LobbyCore = {
  hostUserId: string;
  title: string;
  scenarioName: string | null;
  description: string | null;
  location: string | null;
  maxPlayers: number | null;
};

export type LobbyMemberCore = {
  id: string;
  userId: string | null;
  guestName: string | null;
};

export interface ConfirmLobbyRepository extends LobbyHostRepository {
  findStatusFields(id: string): Promise<LobbyStatusInput | null>;
  findLobbyCore(id: string): Promise<LobbyCore | null>;
  findCandidateOwner(
    dateId: string,
  ): Promise<{ lobbyId: string; date: string } | null>;
  /**
   * 指定 ID のメンバーを取得すると同時に `FOR KEY SHARE` で行をロックする。
   * これにより、この呼び出しからトランザクションのコミット（卓生成・
   * `game_session_members` への INSERT）までの間、対象メンバー行の DELETE
   * （退出など）はコミット待ちでブロックされ、選出メンバーが確定処理の途中で
   * 消えて FK 違反になることを防ぐ。
   */
  findMemberCoresByIds(
    lobbyId: string,
    memberIds: string[],
  ): Promise<LobbyMemberCore[]>;
  createGameSessionFromLobby(params: {
    lobbyId: string;
    hostUserId: string;
    title: string;
    scenarioName: string | null;
    description: string | null;
    location: string | null;
    maxPlayers: number | null;
    scheduledAt: string;
    guestLinkToken: string;
    members: LobbyMemberCore[];
  }): Promise<GameSession>;
  closeLobby(id: string, closedAt: Date): Promise<boolean>;
  /**
   * 確定対象の募集枠行に排他ロックを取り、バリデーションの再実行〜卓生成〜
   * 募集枠クローズまでを 1 トランザクションで実行する（design-v1.1 §5）。
   * 候補日削除・メンバー退出・並行確定/中止が挟まっても、
   * 古い読み取りを根拠に確定してしまわないようにする。
   */
  executeWithLock<T>(
    id: string,
    fn: (lockedRepo: ConfirmLobbyRepository) => Promise<T>,
  ): Promise<T>;
}

export type ConfirmLobbyResult =
  | { type: 'ok'; gameSession: GameSession }
  | { type: 'notFound' }
  | { type: 'forbidden' }
  | { type: 'invalidStatus' }
  | { type: 'candidateNotFound' }
  | { type: 'invalidMembers' }
  | { type: 'conflict' };

// 手順3の条件付き UPDATE（closeLobby）が 0 行だったときに、
// 既に作成した卓・メンバーの INSERT ごとトランザクションをロールバックするための内部シグナル。
class ConfirmLobbyConflictError extends Error {}

export const confirmLobby = async (
  repo: ConfirmLobbyRepository,
  lobbyId: string,
  userId: string,
  input: ConfirmLobbyInput,
  now: Date = new Date(),
): Promise<ConfirmLobbyResult> => {
  try {
    return await repo.executeWithLock(lobbyId, async (locked) => {
      const hostUserId = await locked.findHostUserId(lobbyId);
      if (hostUserId === null) return { type: 'notFound' };
      if (hostUserId !== userId) return { type: 'forbidden' };

      const fields = await locked.findStatusFields(lobbyId);
      if (!fields) return { type: 'notFound' };

      const status = getLobbyStatus(fields, now);
      // 確定済み（並行確定に敗北した場合を含む）は 409 相当
      if (status === LobbyStatus.confirmed) return { type: 'conflict' };
      // draft・cancelled は 422 相当
      if (status !== LobbyStatus.open && status !== LobbyStatus.scheduling) {
        return { type: 'invalidStatus' };
      }

      const candidate = await locked.findCandidateOwner(input.candidateId);
      if (!candidate || candidate.lobbyId !== lobbyId) {
        return { type: 'candidateNotFound' };
      }

      const lobbyCore = await locked.findLobbyCore(lobbyId);
      if (!lobbyCore) return { type: 'notFound' };

      const members = await locked.findMemberCoresByIds(
        lobbyId,
        input.memberIds,
      );
      if (members.length !== input.memberIds.length) {
        return { type: 'invalidMembers' };
      }

      const guestLinkToken = randomBytes(16).toString('base64url');

      const gameSession = await locked.createGameSessionFromLobby({
        lobbyId,
        hostUserId: lobbyCore.hostUserId,
        title: lobbyCore.title,
        scenarioName: lobbyCore.scenarioName,
        description: lobbyCore.description,
        location: lobbyCore.location,
        maxPlayers: lobbyCore.maxPlayers,
        scheduledAt: candidate.date,
        guestLinkToken,
        members,
      });

      const closed = await locked.closeLobby(lobbyId, now);
      if (!closed) {
        throw new ConfirmLobbyConflictError();
      }

      return { type: 'ok', gameSession };
    });
  } catch (err) {
    if (err instanceof ConfirmLobbyConflictError) return { type: 'conflict' };
    throw err;
  }
};
