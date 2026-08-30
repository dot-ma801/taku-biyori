import type {
  LobbyCandidateDate,
  ReplaceCandidateDatesInput,
} from '@taku-biyori/shared';
import {
  LobbyAction,
  canPerformLobbyAction,
  getLobbyStatus,
  normalizeTimeLabel,
  todayDateString,
  type LobbyStatusFacts,
} from '@taku-biyori/shared';
import type { LobbyHostRepository } from '@/lobby/application/lobby-host-repository';
import type { CandidateDateDiff } from '@/lobby/domain/candidate-date-diff';
import { diffCandidateDates } from '@/lobby/domain/candidate-date-diff';

export interface ReplaceCandidateDatesRepository extends LobbyHostRepository {
  findStatusFields(id: string): Promise<LobbyStatusFacts | null>;
  /** 指定 pollId が属するロビー ID。null は調整が存在しないことを表す */
  findSchedulePollLobbyId(pollId: string): Promise<string | null>;
  /** そのロビーの最新の調整 ID（created_at DESC, id DESC で先頭） */
  findLatestSchedulePollId(lobbyId: string): Promise<string | null>;
  /** date ASC 順 */
  findCandidateDatesByPollId(pollId: string): Promise<LobbyCandidateDate[]>;
  /** 差分を1トランザクションで適用する（追加・削除と、残る行の時間帯更新） */
  applyCandidateDateChanges(
    pollId: string,
    diff: CandidateDateDiff,
  ): Promise<void>;
  /**
   * 対象募集枠行に排他ロックを取り、差分計算（読み取り）〜適用（書き込み）までを
   * 1トランザクションで実行する。読み取りと書き込みを別トランザクションに分けると、
   * 並行リクエストが同じ「あるべき状態」を根拠に競合する候補日を追加したり、
   * 「最新の調整」判定がすり替わったりする TOCTOU が起きるため
   * （delete-lobby など、読み取りと書き込みをまたぐ既存ユースケースと同方針）。
   */
  executeWithLock<T>(
    lobbyId: string,
    fn: (lockedRepo: ReplaceCandidateDatesRepository) => Promise<T>,
  ): Promise<T>;
}

export type ReplaceCandidateDatesResult =
  | { type: 'ok'; dates: LobbyCandidateDate[] }
  | { type: 'notFound' }
  | { type: 'forbidden' }
  | { type: 'invalidStatus' }
  | { type: 'notLatest' }
  | { type: 'pastDateAdded' };

/**
 * 日程調整の候補日を一括で差し替える。リクエストの日付リストを「あるべき状態」として
 * 差分適用する。**最新の調整のみ**編集できる。
 *
 * 過去日ルール（issue #114 コメントの決定）: 既存の候補日集合に無い過去日を新たに
 * 追加しようとした場合のみ `pastDateAdded` で弾く。既存にすでにある過去日はそのまま
 * 据え置いてよく、時間帯だけの変更も許す（すでに回答が付いた過去日を消さないため）。
 */
export const replaceCandidateDates = async (
  repo: ReplaceCandidateDatesRepository,
  lobbyId: string,
  pollId: string,
  userId: string,
  input: ReplaceCandidateDatesInput,
): Promise<ReplaceCandidateDatesResult> => {
  return repo.executeWithLock(lobbyId, async (locked) => {
    const hostUserId = await locked.findHostUserId(lobbyId);
    if (hostUserId === null) return { type: 'notFound' };
    if (hostUserId !== userId) return { type: 'forbidden' };

    const fields = await locked.findStatusFields(lobbyId);
    if (!fields) return { type: 'notFound' };
    const status = getLobbyStatus(fields);
    if (
      !canPerformLobbyAction(LobbyAction.editCandidateDates, status, 'host')
    ) {
      return { type: 'invalidStatus' };
    }

    const pollLobbyId = await locked.findSchedulePollLobbyId(pollId);
    if (pollLobbyId === null || pollLobbyId !== lobbyId) {
      return { type: 'notFound' };
    }

    const latestPollId = await locked.findLatestSchedulePollId(lobbyId);
    if (latestPollId !== pollId) return { type: 'notLatest' };

    const existing = await locked.findCandidateDatesByPollId(pollId);
    const existingDates = new Set(existing.map((entry) => entry.date));

    const requested = input.candidateDates.map((entry) => ({
      date: entry.date,
      timeLabel: normalizeTimeLabel(entry.timeLabel),
    }));

    const today = todayDateString();
    const hasPastDateAdded = requested.some(
      (entry) => !existingDates.has(entry.date) && entry.date < today,
    );
    if (hasPastDateAdded) return { type: 'pastDateAdded' };

    const diff = diffCandidateDates(existing, requested);

    if (
      diff.datesToAdd.length === 0 &&
      diff.dateIdsToRemove.length === 0 &&
      diff.timeLabelsToUpdate.length === 0
    ) {
      return { type: 'ok', dates: existing };
    }

    await locked.applyCandidateDateChanges(pollId, diff);
    const dates = await locked.findCandidateDatesByPollId(pollId);
    return { type: 'ok', dates };
  });
};
