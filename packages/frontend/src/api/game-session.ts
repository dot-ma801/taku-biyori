import type {
  CreateGameSessionInput,
  CreateSeatInput,
  GameSession,
  GameSessionDetail,
  GameSessionListItem,
  Seat,
  UpdateGameSessionInput,
  UpdateGameSessionStatusInput,
  MyGameSessionPlayMemo,
  SharedGameSessionPlayMemo,
  UpdateGameSessionPlayMemoVisibilityInput,
  UpsertGameSessionPlayMemoInput,
} from '@taku-biyori/shared';
import { apiRequest } from '@/lib/api-client';
import type {
  GameSessionDetailModel,
  GameSessionListItemModel,
  GameSessionModel,
  SeatModel,
} from '@/models/game-session';
import type { MyPlayMemoModel, SharedPlayMemoModel } from '@/models/play-memo';
import { toMyPlayMemoModel, toSharedPlayMemoModel } from '@/models/play-memo';
import {
  toGameSessionDetailModel,
  toGameSessionListItemModel,
  toGameSessionModel,
  toSeatModel,
} from '@/models/game-session';

/**
 * セッション系の API。
 *
 * **DTO ではなく model を返す。** `@taku-biyori/shared` の型を見てよいのは
 * `src/api/` と `src/models/` だけで、composable / component は model を受け取る
 * （issue #113 以降の規約・CLAUDE.md）。
 *
 * 表示値の解決（`overrides.xxx ?? lobby.xxx`）もこの層の変換で1回だけ行う。
 */

/** セッションのパスはすべてロビー配下（design-v2 §6-5） */
const sessionsPath = (lobbyId: string): string =>
  `/api/lobbies/${lobbyId}/game-sessions`;

const sessionPath = (lobbyId: string, id: string): string =>
  `${sessionsPath(lobbyId)}/${id}`;

const seatsPath = (lobbyId: string, gameSessionId: string): string =>
  `${sessionPath(lobbyId, gameSessionId)}/seats`;

/**
 * 自分に関係する開催の横断一覧。
 * 複数のロビーをまたぐため、これだけは入れ子にしない（design-v2 §6-5）。
 */
export async function listGameSessions(): Promise<GameSessionListItemModel[]> {
  const dto = (await apiRequest<GameSessionListItem[]>(
    '/api/me/game-sessions',
  ))!;
  return dto.map(toGameSessionListItemModel);
}

/** ロビー配下の開催一覧。中止・完了も含めて全件返る（絞り込みは呼び出し側） */
export async function listLobbyGameSessions(
  lobbyId: string,
): Promise<GameSessionListItemModel[]> {
  const dto = (await apiRequest<GameSessionListItem[]>(sessionsPath(lobbyId)))!;
  return dto.map(toGameSessionListItemModel);
}

export async function getGameSession(
  lobbyId: string,
  id: string,
): Promise<GameSessionDetailModel> {
  const dto = (await apiRequest<GameSessionDetail>(sessionPath(lobbyId, id)))!;
  return toGameSessionDetailModel(dto);
}

/**
 * 開催を追加する（旧「卓確定」の後継）。
 *
 * `scheduledAt` は候補日から選んだ日付でも直接入力でもよい。候補日 ID は送らない
 * （開催日の決定は候補日のコピーではなく新しいファクト。design-v2 §5-2）。
 * 上書き項目は**入力があったときだけ**渡す。空欄を送ると既定値のコピーが発生する。
 */
export async function createGameSession(
  lobbyId: string,
  input: CreateGameSessionInput,
): Promise<GameSessionModel> {
  const dto = (await apiRequest<GameSession>(sessionsPath(lobbyId), {
    method: 'POST',
    body: input,
  }))!;
  return toGameSessionModel(dto);
}

/**
 * 開催情報を更新する。
 *
 * **上書き項目に `null` を渡すと上書きを解除する**（以後ロビーの値に追随する）。
 * キーを省略すると変更しない。フォームが空なら `null` を送ること（design-v2 §5-5）。
 */
export async function updateGameSession(
  lobbyId: string,
  id: string,
  input: UpdateGameSessionInput,
): Promise<GameSessionModel> {
  const dto = (await apiRequest<GameSession>(sessionPath(lobbyId, id), {
    method: 'PATCH',
    body: input,
  }))!;
  return toGameSessionModel(dto);
}

export function deleteGameSession(lobbyId: string, id: string): Promise<void> {
  return apiRequest<void>(sessionPath(lobbyId, id), { method: 'DELETE' });
}

/** 完了・中止。どちらも終端で、取り消しは無い */
export async function updateGameSessionStatus(
  lobbyId: string,
  id: string,
  input: UpdateGameSessionStatusInput,
): Promise<GameSessionModel> {
  const dto = (await apiRequest<GameSession>(
    `${sessionPath(lobbyId, id)}/status`,
    { method: 'PATCH', body: input },
  ))!;
  return toGameSessionModel(dto);
}

// ---------- 着席 ----------

export async function listSeats(
  lobbyId: string,
  gameSessionId: string,
): Promise<SeatModel[]> {
  const dto = (await apiRequest<Seat[]>(seatsPath(lobbyId, gameSessionId)))!;
  return dto.map(toSeatModel);
}

/**
 * 着席させる。**操作できるのはホストだけで `entryId` は必須**（design-v2 §6-6）。
 * 自分で着席する経路とゲストの「参加 + 着席」はどちらも廃止された。
 */
export async function createSeat(
  lobbyId: string,
  gameSessionId: string,
  input: CreateSeatInput,
): Promise<SeatModel> {
  const dto = (await apiRequest<Seat>(seatsPath(lobbyId, gameSessionId), {
    method: 'POST',
    body: input,
  }))!;
  return toSeatModel(dto);
}

/**
 * 着席を更新する。更新できるのはキャラクター名だけで、`null` が解除を表す。
 * 本人またはホストが操作できる（design-v2 §6-11）。
 *
 * 実体は `character_assignments` に分かれているが、API から見た更新対象は Seat のまま。
 * `.../seats/:seatId/character` のようなサブリソースは持たない。
 */
function updateSeat(
  lobbyId: string,
  gameSessionId: string,
  seatId: string,
  characterName: string | null,
): Promise<SeatModel> {
  return apiRequest<Seat>(`${seatsPath(lobbyId, gameSessionId)}/${seatId}`, {
    method: 'PATCH',
    body: { characterName },
  }).then((dto) => toSeatModel(dto!));
}

/** キャラクター名を割り当てる。本人またはホスト */
export function assignCharacter(
  lobbyId: string,
  gameSessionId: string,
  seatId: string,
  characterName: string,
): Promise<SeatModel> {
  return updateSeat(lobbyId, gameSessionId, seatId, characterName);
}

/** キャラクター名の割り当てを解除する。未割り当てでも成功する（冪等） */
export function unassignCharacter(
  lobbyId: string,
  gameSessionId: string,
  seatId: string,
): Promise<SeatModel> {
  return updateSeat(lobbyId, gameSessionId, seatId, null);
}

/** 離席。本人またはホスト */
export function deleteSeat(
  lobbyId: string,
  gameSessionId: string,
  seatId: string,
): Promise<void> {
  return apiRequest<void>(`${seatsPath(lobbyId, gameSessionId)}/${seatId}`, {
    method: 'DELETE',
  });
}

// ---------- プレイメモ ----------

/**
 * 自分のプレイメモを取得する。
 *
 * メモを一度も書いていなくても 404 にはならず、`updatedAt: null` の空メモが返る
 * （design-v1.2 §8）。呼び出し側に「未作成」の分岐は不要。
 */
export async function getMyPlayMemo(
  gameSessionId: string,
): Promise<MyPlayMemoModel> {
  return toMyPlayMemoModel(
    (await apiRequest<MyGameSessionPlayMemo>(
      `/api/game-sessions/${gameSessionId}/play-memos/me`,
    ))!,
  );
}

/**
 * 自分のプレイメモの本文を保存する。
 *
 * 卓が完了・中止していると 409（ApiError.status）が返る。
 */
export async function upsertMyPlayMemo(
  gameSessionId: string,
  input: UpsertGameSessionPlayMemoInput,
): Promise<MyPlayMemoModel> {
  return toMyPlayMemoModel(
    (await apiRequest<MyGameSessionPlayMemo>(
      `/api/game-sessions/${gameSessionId}/play-memos/me`,
      { method: 'PUT', body: input },
    ))!,
  );
}

/**
 * 自分のプレイメモの公開・非公開を切り替える。
 *
 * 本文の保存と違い、完了・中止した卓でも呼べる（切替はステータス非依存。design-v1.2 §4）。
 * 本文を一度も保存していないメモには 404 が返るため、呼び出し側は保存済みのときだけ叩く。
 */
export async function updateMyPlayMemoVisibility(
  gameSessionId: string,
  input: UpdateGameSessionPlayMemoVisibilityInput,
): Promise<MyPlayMemoModel> {
  return toMyPlayMemoModel(
    (await apiRequest<MyGameSessionPlayMemo>(
      `/api/game-sessions/${gameSessionId}/play-memos/me/visibility`,
      { method: 'PATCH', body: input },
    ))!,
  );
}

/**
 * 卓の公開プレイメモを一覧する。
 *
 * 認証は不要（未ログイン・ゲストでも読める。要求 §3-4）。レスポンスは閲覧者で分岐せず、
 * 自分の公開メモも含めて返る（design-v1.2 §8）。誰のメモかは seatId だけが返るため、
 * 表示名は卓のメンバー一覧と突き合わせて解決する。
 */
export async function listSharedPlayMemos(
  gameSessionId: string,
): Promise<SharedPlayMemoModel[]> {
  return (await apiRequest<SharedGameSessionPlayMemo[]>(
    `/api/game-sessions/${gameSessionId}/play-memos`,
  ))!.map(toSharedPlayMemoModel);
}
