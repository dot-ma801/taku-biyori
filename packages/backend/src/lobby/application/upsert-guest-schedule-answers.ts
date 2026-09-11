import type {
  GuestUpsertScheduleAnswersInput,
  LobbyScheduleAnswer,
  ScheduleAnswerItem,
} from '@taku-biyori/shared';
import {
  LobbyAction,
  canPerformLobbyAction,
  getLobbyStatus,
  type LobbyStatusFacts,
} from '@taku-biyori/shared';

export interface UpsertGuestScheduleAnswersRepository {
  // ロビーの guest_link_token。null はロビー非存在を表す
  findGuestLinkToken(lobbyId: string): Promise<string | null>;
  findStatusFields(lobbyId: string): Promise<LobbyStatusFacts | null>;
  /** 指定 pollId が属するロビー ID。null は調整が存在しないことを表す */
  findSchedulePollLobbyId(pollId: string): Promise<string | null>;
  /** そのロビーの最新の調整 ID（created_at DESC, id DESC で先頭） */
  findLatestSchedulePollId(lobbyId: string): Promise<string | null>;
  // entryId がそのロビーの在籍中ゲスト（user_id = null かつ left_at = null）か
  isGuestEntry(lobbyId: string, entryId: string): Promise<boolean>;
  findCandidateDateIdsByPollId(pollId: string): Promise<string[]>;
  upsertScheduleAnswers(
    entryId: string,
    items: readonly ScheduleAnswerItem[],
  ): Promise<LobbyScheduleAnswer[]>;
  /**
   * ログインユーザー用の回答と同じ理由でロックを取る。
   * 詳細は upsert-schedule-answers.ts の同名メソッドのコメントを参照。
   */
  executeWithLock<T>(
    lobbyId: string,
    fn: (lockedRepo: UpsertGuestScheduleAnswersRepository) => Promise<T>,
  ): Promise<T>;
}

export type UpsertGuestScheduleAnswersResult =
  | { type: 'ok'; answers: LobbyScheduleAnswer[] }
  | { type: 'notFound' }
  | { type: 'invalidToken' }
  | { type: 'forbidden' }
  | { type: 'invalidStatus' }
  | { type: 'notLatest' };

/**
 * ゲスト（完全匿名）が日程調整の候補日にまとめて回答する（調整さん方式）。
 * - トークンがロビーの guest_link_token と一致しなければ invalidToken（403 相当）
 * - 回答を許すステータス（open / closed）以外なら invalidStatus（409 相当）。
 *   未公開（draft）と解散（disbanded）が該当する。draft も含めて一律 invalidStatus とするのは
 *   design-v1.1 の意思決定ログを継続したもの。受付終了（closed）でも回答は続けられる
 *   （閉じているのは新しい参加の入口だけ。design-v2 §3-2）
 * - **最新の調整のみ**回答できる
 * - 指定 entryId がそのロビーの在籍中ゲスト（user_id = null）でなければ forbidden（403 相当）
 * 本人確認はしないため、トークンさえ持っていればどのゲスト列でも更新できる。
 * トークン検証と status 取得を並列で実行してレイテンシを削減する。
 */
export const upsertGuestScheduleAnswers = async (
  repo: UpsertGuestScheduleAnswersRepository,
  lobbyId: string,
  pollId: string,
  token: string,
  input: GuestUpsertScheduleAnswersInput,
): Promise<UpsertGuestScheduleAnswersResult> => {
  return repo.executeWithLock(lobbyId, async (locked) => {
    // token 検証と status 取得を並列で実行してレイテンシを削減する
    const [storedToken, fields] = await Promise.all([
      locked.findGuestLinkToken(lobbyId),
      locked.findStatusFields(lobbyId),
    ]);

    if (!fields) return { type: 'notFound' };
    if (storedToken !== token) return { type: 'invalidToken' };

    const status = getLobbyStatus(fields);
    if (!canPerformLobbyAction(LobbyAction.answerSchedule, status, 'guest')) {
      return { type: 'invalidStatus' };
    }

    const pollLobbyId = await locked.findSchedulePollLobbyId(pollId);
    if (pollLobbyId === null || pollLobbyId !== lobbyId) {
      return { type: 'notFound' };
    }

    const latestPollId = await locked.findLatestSchedulePollId(lobbyId);
    if (latestPollId !== pollId) return { type: 'notLatest' };

    const isGuest = await locked.isGuestEntry(lobbyId, input.entryId);
    if (!isGuest) return { type: 'forbidden' };

    const candidateDateIds = await locked.findCandidateDateIdsByPollId(pollId);
    const validCandidateDateIds = new Set(candidateDateIds);
    const hasInvalidCandidateDate = input.answers.some(
      (item) => !validCandidateDateIds.has(item.candidateDateId),
    );
    if (hasInvalidCandidateDate) return { type: 'notFound' };

    const answers = await locked.upsertScheduleAnswers(
      input.entryId,
      input.answers,
    );
    return { type: 'ok', answers };
  });
};
