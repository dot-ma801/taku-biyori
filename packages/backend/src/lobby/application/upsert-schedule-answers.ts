import type {
  LobbyScheduleAnswer,
  ScheduleAnswerItem,
  UpsertScheduleAnswersInput,
} from '@taku-biyori/shared';
import {
  LobbyAction,
  LobbyStatus,
  canPerformLobbyAction,
  getLobbyStatus,
  type LobbyStatusFacts,
} from '@taku-biyori/shared';

export interface UpsertScheduleAnswersRepository {
  findStatusFields(lobbyId: string): Promise<LobbyStatusFacts | null>;
  /** 指定 pollId が属するロビー ID。null は調整が存在しないことを表す */
  findSchedulePollLobbyId(pollId: string): Promise<string | null>;
  /** そのロビーの最新の調整 ID（created_at DESC, id DESC で先頭） */
  findLatestSchedulePollId(lobbyId: string): Promise<string | null>;
  /** 在籍中の参加だけを引く。脱退済みの行では回答させない */
  findActiveEntryByUserId(
    lobbyId: string,
    userId: string,
  ): Promise<string | null>;
  findCandidateDateIdsByPollId(pollId: string): Promise<string[]>;
  upsertScheduleAnswers(
    entryId: string,
    items: readonly ScheduleAnswerItem[],
  ): Promise<LobbyScheduleAnswer[]>;
  /**
   * 対象ロビー行に排他ロックを取り、「最新の調整か」「候補日がこの調整のものか」の
   * 判定（読み取り）から回答の upsert（書き込み）までを1トランザクションで実行する。
   * 分けると、判定のあとに別リクエストが新しい調整を作って古い調整へ書き込めてしまい、
   * 候補日の一括更新と重なると検証済みの候補日が消えて外部キー違反になる
   * （create-schedule-poll / replace-candidate-dates と同じロックを使う）。
   */
  executeWithLock<T>(
    lobbyId: string,
    fn: (lockedRepo: UpsertScheduleAnswersRepository) => Promise<T>,
  ): Promise<T>;
}

export type UpsertScheduleAnswersResult =
  | { type: 'ok'; answers: LobbyScheduleAnswer[] }
  | { type: 'notFound' }
  | { type: 'forbidden' }
  // 公開前（draft）は回答できない。game-session にはないチェック（design-v1.1 意思決定ログ）
  | { type: 'notPublished' }
  | { type: 'invalidStatus' }
  | { type: 'notLatest' };

/**
 * メンバーが日程調整の候補日に◯△×をまとめて回答する。**最新の調整のみ**回答できる。
 */
export const upsertScheduleAnswers = async (
  repo: UpsertScheduleAnswersRepository,
  lobbyId: string,
  pollId: string,
  userId: string,
  input: UpsertScheduleAnswersInput,
): Promise<UpsertScheduleAnswersResult> => {
  return repo.executeWithLock(lobbyId, async (locked) => {
    const fields = await locked.findStatusFields(lobbyId);
    if (!fields) return { type: 'notFound' };

    const pollLobbyId = await locked.findSchedulePollLobbyId(pollId);
    if (pollLobbyId === null || pollLobbyId !== lobbyId) {
      return { type: 'notFound' };
    }

    const latestPollId = await locked.findLatestSchedulePollId(lobbyId);
    if (latestPollId !== pollId) return { type: 'notLatest' };

    const entryId = await locked.findActiveEntryByUserId(lobbyId, userId);
    if (!entryId) return { type: 'forbidden' };

    const status = getLobbyStatus(fields);
    if (status === LobbyStatus.draft) return { type: 'notPublished' };
    // 受付終了（closed）でも、すでに参加している人は回答できる（design-v2 §3-2）
    if (!canPerformLobbyAction(LobbyAction.answerSchedule, status, 'member')) {
      return { type: 'invalidStatus' };
    }

    const candidateDateIds = await locked.findCandidateDateIdsByPollId(pollId);
    const validCandidateDateIds = new Set(candidateDateIds);
    const hasInvalidCandidateDate = input.answers.some(
      (item) => !validCandidateDateIds.has(item.candidateDateId),
    );
    if (hasInvalidCandidateDate) return { type: 'notFound' };

    const answers = await locked.upsertScheduleAnswers(entryId, input.answers);
    return { type: 'ok', answers };
  });
};
