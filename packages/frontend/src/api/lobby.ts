import type {
  CreateLobbyInput,
  CreateSchedulePollInput,
  GuestUpsertScheduleAnswersInput,
  JoinLobbyAsGuestInput,
  JoinLobbyInput,
  Lobby,
  LobbyCandidateDate,
  LobbyDetail,
  LobbyGuestLinkResponse,
  LobbyListItem,
  LobbyEntry,
  LobbyScheduleAnswer,
  LobbySchedulePoll,
  LobbySchedulePollSummary,
  ReplaceCandidateDatesInput,
  UpdateLobbyInput,
  UpdateLobbyStatusInput,
  UpsertScheduleAnswersInput,
} from '@taku-biyori/shared';
import { GUEST_TOKEN_HEADER } from '@taku-biyori/shared';
import { apiRequest } from '@/lib/api-client';
import type {
  LobbyDetailModel,
  LobbyEntryModel,
  LobbyListItemModel,
  LobbyModel,
} from '@/models/lobby';
import {
  toLobbyDetailModel,
  toLobbyEntryModel,
  toLobbyListItemModel,
  toLobbyModel,
} from '@/models/lobby';
import type {
  CandidateDateModel,
  ScheduleAnswerModel,
  SchedulePollModel,
  SchedulePollSummaryModel,
} from '@/models/schedule-poll';
import {
  toReplacedCandidateDateModel,
  toScheduleAnswerModel,
  toSchedulePollModel,
  toSchedulePollSummaryModel,
} from '@/models/schedule-poll';

// この層が DTO と model の境界。ここより内側（composable / component）は
// `@taku-biyori/shared` のレスポンス型を見ない（issue #113 の規約）。

/**
 * 自分のロビー（ホスト or 在籍中の参加者）。ログイン必須（design-v2 §6-2）。
 * ダッシュボードの「参加中のロビー」「下書きのロビー」がこれを使う。
 */
export async function listMyLobbies(): Promise<LobbyListItemModel[]> {
  const dto = (await apiRequest<LobbyListItem[]>('/api/me/lobbies'))!;
  return dto.map(toLobbyListItemModel);
}

/** 公開かつ受付中のロビー。未ログインでも取得できる（design-v2 §6-2）。 */
export async function listPublicLobbies(): Promise<LobbyListItemModel[]> {
  const dto = (await apiRequest<LobbyListItem[]>('/api/lobbies'))!;
  return dto.map(toLobbyListItemModel);
}

export async function createLobby(
  input: CreateLobbyInput,
): Promise<LobbyModel> {
  const dto = (await apiRequest<Lobby>('/api/lobbies', {
    method: 'POST',
    body: input,
  }))!;
  return toLobbyModel(dto);
}

export async function getLobby(id: string): Promise<LobbyDetailModel> {
  const dto = (await apiRequest<LobbyDetail>(`/api/lobbies/${id}`))!;
  return toLobbyDetailModel(dto);
}

export async function updateLobby(
  id: string,
  input: UpdateLobbyInput,
): Promise<LobbyModel> {
  const dto = (await apiRequest<Lobby>(`/api/lobbies/${id}`, {
    method: 'PATCH',
    body: input,
  }))!;
  return toLobbyModel(dto);
}

export async function joinLobby(
  id: string,
  input: JoinLobbyInput,
): Promise<LobbyEntryModel> {
  const dto = (await apiRequest<LobbyEntry>(`/api/lobbies/${id}/entries`, {
    method: 'POST',
    body: input,
  }))!;
  return toLobbyEntryModel(dto);
}

export function leaveLobby(id: string, entryId: string): Promise<void> {
  return apiRequest<void>(`/api/lobbies/${id}/entries/${entryId}`, {
    method: 'DELETE',
  });
}

export async function updateLobbyStatus(
  id: string,
  input: UpdateLobbyStatusInput,
): Promise<LobbyModel> {
  const dto = (await apiRequest<Lobby>(`/api/lobbies/${id}/status`, {
    method: 'PATCH',
    body: input,
  }))!;
  return toLobbyModel(dto);
}

// ---------- ゲスト（完全匿名）フロー ----------

/** ホストがゲスト招待用のトークンを取得する。 */
export async function getLobbyGuestLink(
  id: string,
): Promise<LobbyGuestLinkResponse> {
  return (await apiRequest<LobbyGuestLinkResponse>(
    `/api/lobbies/${id}/guest-link`,
  ))!;
}

/**
 * ホストがゲスト招待用のトークンを再発行する。旧トークンは即座に無効になる。
 * 新しいリソースを作るわけではないので 200 が返る（design-v2 §6-12-1）。
 */
export async function regenerateLobbyGuestLink(
  id: string,
): Promise<LobbyGuestLinkResponse> {
  return (await apiRequest<LobbyGuestLinkResponse>(
    `/api/lobbies/${id}/guest-link`,
    { method: 'POST' },
  ))!;
}

/**
 * ゲストとしてロビーに参加する。認証不要で、トークンは Guest-Token ヘッダーで送る。
 */
export async function joinLobbyAsGuest(
  id: string,
  token: string,
  input: JoinLobbyAsGuestInput,
): Promise<LobbyEntryModel> {
  const dto = (await apiRequest<LobbyEntry>(
    `/api/lobbies/${id}/guest-entries`,
    {
      method: 'POST',
      body: input,
      headers: { [GUEST_TOKEN_HEADER]: token },
    },
  ))!;
  return toLobbyEntryModel(dto);
}

// ---------- 日程調整（SchedulePoll、v2） ----------

/** ロビーの日程調整の履歴を、新しい順（先頭が最新）で取得する。 */
export async function listSchedulePolls(
  lobbyId: string,
): Promise<SchedulePollSummaryModel[]> {
  const dto = (await apiRequest<LobbySchedulePollSummary[]>(
    `/api/lobbies/${lobbyId}/schedule-polls`,
  ))!;
  return dto.map(toSchedulePollSummaryModel);
}

/**
 * 新しい日程調整を開始する（ホストのみ）。既存の調整は履歴として残り、
 * 以降はこの調整が「最新」になる。
 */
export async function createSchedulePoll(
  lobbyId: string,
  input: CreateSchedulePollInput,
): Promise<SchedulePollModel> {
  const dto = (await apiRequest<LobbySchedulePoll>(
    `/api/lobbies/${lobbyId}/schedule-polls`,
    { method: 'POST', body: input },
  ))!;
  return toSchedulePollModel(dto);
}

/** 指定した日程調整（候補日・回答を含む）を取得する。過去の調整の閲覧にも使う。 */
export async function getSchedulePoll(
  lobbyId: string,
  pollId: string,
): Promise<SchedulePollModel> {
  const dto = (await apiRequest<LobbySchedulePoll>(
    `/api/lobbies/${lobbyId}/schedule-polls/${pollId}`,
  ))!;
  return toSchedulePollModel(dto);
}

/**
 * 日程調整の候補日を一括で差し替える（ホストのみ・最新の調整のみ編集可）。
 * レスポンスに回答は含まれない（`CandidateDateModel.answersByEntryId` は空になる）。
 */
export async function replaceCandidateDates(
  lobbyId: string,
  pollId: string,
  input: ReplaceCandidateDatesInput,
): Promise<CandidateDateModel[]> {
  const dto = (await apiRequest<LobbyCandidateDate[]>(
    `/api/lobbies/${lobbyId}/schedule-polls/${pollId}/candidate-dates`,
    { method: 'PUT', body: input },
  ))!;
  return dto.map(toReplacedCandidateDateModel);
}

/**
 * ログインユーザーの日程回答をまとめて upsert する（差分更新で、送った候補日ぶんだけ更新する）。
 */
export async function upsertScheduleAnswers(
  lobbyId: string,
  pollId: string,
  input: UpsertScheduleAnswersInput,
): Promise<ScheduleAnswerModel[]> {
  const dto = (await apiRequest<LobbyScheduleAnswer[]>(
    `/api/lobbies/${lobbyId}/schedule-polls/${pollId}/answers`,
    { method: 'PATCH', body: input },
  ))!;
  return dto.map(toScheduleAnswerModel);
}

/**
 * ゲストの日程回答をまとめて upsert する。認証不要で、トークンは Guest-Token ヘッダーで送る。
 * input には対象ゲスト列を示す entryId を含める。
 */
export async function upsertGuestScheduleAnswers(
  lobbyId: string,
  pollId: string,
  token: string,
  input: GuestUpsertScheduleAnswersInput,
): Promise<ScheduleAnswerModel[]> {
  const dto = (await apiRequest<LobbyScheduleAnswer[]>(
    `/api/lobbies/${lobbyId}/schedule-polls/${pollId}/guest-answers`,
    { method: 'PATCH', body: input, headers: { [GUEST_TOKEN_HEADER]: token } },
  ))!;
  return dto.map(toScheduleAnswerModel);
}
