import type {
  LobbyCandidateDate,
  LobbyCandidateDateWithAnswers,
  LobbyScheduleAnswer,
  LobbySchedulePoll,
  LobbySchedulePollSummary,
} from '@taku-biyori/shared';

/**
 * 日程調整（SchedulePoll）系の model と、DTO（`@taku-biyori/shared` の契約型）からの変換関数。
 *
 * `@taku-biyori/shared` の型は API との通信契約（DTO）であって frontend 内部の構造ではない。
 * DTO を見てよいのは `src/api/` と `src/models/` だけで、composable / component は
 * model だけを受け取る（issue #113 以降の規約）。
 *
 * 回答を entryId で引く `find` は composable ではなくここに閉じ込める
 * （`answersByEntryId` を Map として持たせ、`.get(entryId)` で引けるようにする）。
 */

export type ScheduleAnswerValue = 'ok' | 'maybe' | 'ng';

export type ScheduleAnswerModel = {
  id: string;
  entryId: string;
  answer: ScheduleAnswerValue;
  comment: string | null;
};

export type CandidateDateModel = {
  id: string;
  /** 日付のみの値。タイムゾーンでずれないよう文字列（`YYYY-MM-DD`）のまま持つ */
  date: string;
  timeLabel: string | null;
  /** 回答を entryId で引ける形にしておく。配列のまま持ち回らない */
  answersByEntryId: Map<string, ScheduleAnswerModel>;
};

export type SchedulePollModel = {
  id: string;
  lobbyId: string;
  candidateDates: CandidateDateModel[];
  /** 瞬間なので Date */
  createdAt: Date;
};

export type SchedulePollSummaryModel = { id: string; createdAt: Date };

export const toScheduleAnswerModel = (
  dto: LobbyScheduleAnswer,
): ScheduleAnswerModel => ({
  id: dto.id,
  entryId: dto.entryId,
  answer: dto.answer,
  comment: dto.comment ?? null,
});

export const toCandidateDateModel = (
  dto: LobbyCandidateDateWithAnswers,
): CandidateDateModel => ({
  id: dto.id,
  date: dto.date,
  timeLabel: dto.timeLabel ?? null,
  answersByEntryId: new Map(
    dto.answers.map((answer) => [
      answer.entryId,
      toScheduleAnswerModel(answer),
    ]),
  ),
});

export const toSchedulePollModel = (
  dto: LobbySchedulePoll,
): SchedulePollModel => ({
  id: dto.id,
  lobbyId: dto.lobbyId,
  candidateDates: dto.candidateDates.map(toCandidateDateModel),
  createdAt: new Date(dto.createdAt),
});

/**
 * 候補日の全置換（`PUT .../candidate-dates`）のレスポンス用。
 * このエンドポイントは回答を返さない契約（`LobbyCandidateDate` に `answers` が無い）ため、
 * `answersByEntryId` は常に空の Map になる。回答つきで見せたい場合は呼び出し側で
 * 調整（`SchedulePollModel`）を取得し直すこと。
 */
export const toReplacedCandidateDateModel = (
  dto: LobbyCandidateDate,
): CandidateDateModel => ({
  id: dto.id,
  date: dto.date,
  timeLabel: dto.timeLabel ?? null,
  answersByEntryId: new Map(),
});

export const toSchedulePollSummaryModel = (
  dto: LobbySchedulePollSummary,
): SchedulePollSummaryModel => ({
  id: dto.id,
  createdAt: new Date(dto.createdAt),
});
