import type {
  CreateSchedulePollInput,
  LobbySchedulePoll,
} from '@taku-biyori/shared';
import {
  LobbyAction,
  canPerformLobbyAction,
  getLobbyStatus,
  normalizeTimeLabel,
  type LobbyStatusFacts,
} from '@taku-biyori/shared';
import type { LobbyHostRepository } from '@/lobby/application/lobby-host-repository';
import type { CandidateDateEntry } from '@/lobby/domain/candidate-date-diff';

export interface CreateSchedulePollRepository extends LobbyHostRepository {
  findStatusFields(id: string): Promise<LobbyStatusFacts | null>;
  /** 新規の調整を1件作る。候補日ぶんの `answers` は必ず空配列で返る */
  createSchedulePollWithDates(
    lobbyId: string,
    dates: readonly CandidateDateEntry[],
  ): Promise<LobbySchedulePoll>;
  /**
   * 対象募集枠行に排他ロックを取り、コールバック内のクエリを1トランザクションで実行する。
   * `replaceCandidateDates` の「最新かどうか」判定と直列化するため
   * （delete-lobby など、読み取りと書き込みをまたぐ既存ユースケースと同方針）。
   */
  executeWithLock<T>(
    lobbyId: string,
    fn: (lockedRepo: CreateSchedulePollRepository) => Promise<T>,
  ): Promise<T>;
}

export type CreateSchedulePollResult =
  | { type: 'ok'; poll: LobbySchedulePoll }
  | { type: 'notFound' }
  | { type: 'forbidden' }
  | { type: 'invalidStatus' };

/**
 * 日程調整を新しく始める。候補日には毎回新しい調整行が割り当てられ、古い調整は残る
 * （design-v2 §3-4）。過去日チェックは shared の `CreateSchedulePollInputSchema` で
 * すでに行っているため、ここでは行わない。
 */
export const createSchedulePoll = async (
  repo: CreateSchedulePollRepository,
  lobbyId: string,
  userId: string,
  input: CreateSchedulePollInput,
): Promise<CreateSchedulePollResult> => {
  return repo.executeWithLock(lobbyId, async (locked) => {
    const hostUserId = await locked.findHostUserId(lobbyId);
    if (hostUserId === null) return { type: 'notFound' };
    if (hostUserId !== userId) return { type: 'forbidden' };

    const fields = await locked.findStatusFields(lobbyId);
    if (!fields) return { type: 'notFound' };
    const status = getLobbyStatus(fields);
    if (!canPerformLobbyAction(LobbyAction.startSchedulePoll, status, 'host')) {
      return { type: 'invalidStatus' };
    }

    const dates: CandidateDateEntry[] = input.candidateDates.map((entry) => ({
      date: entry.date,
      timeLabel: normalizeTimeLabel(entry.timeLabel),
    }));

    const poll = await locked.createSchedulePollWithDates(lobbyId, dates);
    return { type: 'ok', poll };
  });
};
