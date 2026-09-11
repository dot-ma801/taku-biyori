import type {
  GameSession,
  GameSessionDetail,
  GameSessionListItem,
  GameSessionOverrides,
  GameSessionStatus,
  LobbyStatus,
  Seat,
} from '@taku-biyori/shared';
import {
  getGameSessionStatus,
  isGuestSeat,
  resolveGameSessionDisplay,
} from '@taku-biyori/shared';

/**
 * セッション系の model と、DTO（`@taku-biyori/shared` の契約型）からの変換関数。
 *
 * **`@taku-biyori/shared` の型は API との通信契約（DTO）であって、frontend 内部で
 * 扱うデータ構造ではない。** DTO を見てよいのは `src/api/` と `src/models/` だけで、
 * composable / component は model だけを受け取る（issue #113 以降の規約）。
 *
 * この層が引き受けること:
 * - **表示値の解決**（`overrides.xxx ?? lobby.xxx`）をここで1回だけ済ませる。
 *   画面ごとに `??` を書かない（design-v2 §5-5）
 * - **`overrides` の生値も残す**。捨てると「ロビーと同じ値」と「明示的な上書き」が
 *   区別できなくなり、編集フォームが意図しない上書きを発生させる
 * - ステータスをファクトから導出し直す（design-v2 §4-5）
 * - タイムスタンプを `Date` にする
 *
 * `scheduledAt` は**文字列のまま持つ**。日付のみの値を `Date` にすると
 * タイムゾーンで日付がずれるため（CLAUDE.md。`LobbyModel.openUntil` と同じ扱い）。
 *
 * 表示用のフォールバック文言（「未設定」など）は UI の関心事なのでここには置かない。
 */

/** セッション詳細に埋め込まれるロビー。既定値の出所であり、パンくずとホスト判定にも使う */
export type GameSessionLobbyModel = {
  id: string;
  title: string;
  scenarioName: string | null;
  location: string | null;
  maxPlayers: number | null;
  hostUserId: string;
  status: LobbyStatus;
};

/** 着席。表示名は LobbyEntry 由来の解決値（design-v2 §3-8） */
export type SeatModel = {
  id: string;
  entryId: string;
  userId: string | null;
  userName: string | null;
  guestName: string | null;
  characterName: string | null;
  seatedAt: Date;
  /** ゲスト（アカウントを持たない参加者）かどうか */
  isGuest: boolean;
};

export type GameSessionModel = {
  id: string;
  lobbyId: string;
  /** 開催日（`YYYY-MM-DD`）。**`Date` にしない** */
  scheduledAt: string;
  /** ファクトから導出済みのステータス */
  status: GameSessionStatus;
  /** 当日の連絡事項。上書き項目ではない */
  description: string | null;

  /** 解決済みの表示値（未設定ならロビーの値） */
  title: string;
  scenarioName: string | null;
  location: string | null;
  timeLabel: string | null;

  /**
   * 上書きの**生値**。`null` は「上書きしていない」。
   * **編集フォームの初期値にはこちらを使う。** 解決済みの表示値を入れると
   * 保存時に意図しない上書きが発生する（design-v2 §5-5）
   */
  overrides: GameSessionOverrides;

  /** 既定値の出所。パンくず・ホスト判定にも使う */
  lobby: GameSessionLobbyModel;

  completedAt: Date | null;
  cancelledAt: Date | null;
  createdAt: Date;
  updatedAt: Date;
};

export type GameSessionDetailModel = GameSessionModel & {
  /** 着席者。`seatedAt` 昇順 */
  seats: SeatModel[];
};

export type GameSessionListItemModel = {
  id: string;
  lobbyId: string;
  /** 一覧では**サーバが解決済み**の表示値が返る（design-v2 §5-5） */
  title: string;
  scenarioName: string | null;
  timeLabel: string | null;
  status: GameSessionStatus;
  /** 開催日（`YYYY-MM-DD`） */
  scheduledAt: string;
  /** 着席数。一覧で必要なのは人数と「自分がいるか」だけ */
  seatCount: number;
  /** 着席しているログインユーザーの ID。ゲストは含まれない */
  seatUserIds: string[];
  hostUserId: string;
  createdAt: Date;
  updatedAt: Date;
};

export const toSeatModel = (dto: Seat): SeatModel => ({
  id: dto.id,
  entryId: dto.entryId,
  userId: dto.userId,
  userName: dto.userName,
  guestName: dto.guestName,
  characterName: dto.characterName,
  seatedAt: new Date(dto.seatedAt),
  isGuest: isGuestSeat(dto),
});

export const toGameSessionModel = (dto: GameSession): GameSessionModel => {
  // 解決はここで1回だけ。composable / component は `??` を書かない
  const display = resolveGameSessionDisplay(dto, dto.lobby);

  return {
    id: dto.id,
    lobbyId: dto.lobbyId,
    scheduledAt: dto.scheduledAt,
    // レスポンスの status をそのまま使わず、ファクトから導出し直す（design-v2 §4-5）。
    // `today` は時刻依存なので、日付をまたいで開いたままのページでも
    // 再取得すれば正しく表示される
    status: getGameSessionStatus({
      scheduledAt: dto.scheduledAt,
      completedAt: dto.completedAt,
      cancelledAt: dto.cancelledAt,
    }),
    description: dto.description,

    title: display.title,
    scenarioName: display.scenarioName,
    location: display.location,
    timeLabel: display.timeLabel,

    overrides: { ...dto.overrides },

    lobby: {
      id: dto.lobby.id,
      title: dto.lobby.title,
      scenarioName: dto.lobby.scenarioName,
      location: dto.lobby.location,
      maxPlayers: dto.lobby.maxPlayers,
      hostUserId: dto.lobby.hostUserId,
      status: dto.lobby.status,
    },

    completedAt: dto.completedAt ? new Date(dto.completedAt) : null,
    cancelledAt: dto.cancelledAt ? new Date(dto.cancelledAt) : null,
    createdAt: new Date(dto.createdAt),
    updatedAt: new Date(dto.updatedAt),
  };
};

export const toGameSessionDetailModel = (
  dto: GameSessionDetail,
): GameSessionDetailModel => ({
  ...toGameSessionModel(dto),
  seats: dto.seats.map(toSeatModel),
});

/**
 * 一覧の契約は `completedAt` / `cancelledAt` を持たず `status` しか返さない。
 * 終端かどうかだけはサーバの導出結果から復元し、`today` の判定だけを
 * クライアントのローカル日付でやり直す。
 */
const deriveTerminalFacts = (
  status: GameSessionStatus,
): { completedAt: Date | null; cancelledAt: Date | null } => {
  const terminal = new Date(0);
  if (status === 'cancelled') {
    return { completedAt: null, cancelledAt: terminal };
  }
  if (status === 'completed') {
    return { completedAt: terminal, cancelledAt: null };
  }
  return { completedAt: null, cancelledAt: null };
};

export const toGameSessionListItemModel = (
  dto: GameSessionListItem,
): GameSessionListItemModel => ({
  id: dto.id,
  lobbyId: dto.lobbyId,
  // 一覧の契約は overrides も lobby も持たないため、サーバが解決した値を使う
  title: dto.title,
  scenarioName: dto.scenarioName,
  timeLabel: dto.timeLabel,
  status: getGameSessionStatus({
    scheduledAt: dto.scheduledAt,
    ...deriveTerminalFacts(dto.status),
  }),
  scheduledAt: dto.scheduledAt,
  seatCount: dto.seats.length,
  seatUserIds: dto.seats
    .map((seat) => seat.userId)
    .filter((userId): userId is string => userId !== null),
  hostUserId: dto.hostUserId,
  createdAt: new Date(dto.createdAt),
  updatedAt: new Date(dto.updatedAt),
});
