import { GameSessionStatus } from '@taku-biyori/shared';
import type { LobbyListItemModel } from '@/models/lobby';
import type { GameSessionListItemModel } from '@/models/game-session';
import {
  byNewestSession,
  resolveGameSessionCardStatus,
} from '@/features/GameSession/resolveGameSessionCardStatus';
import { GameSessionCardStatus } from '@/features/GameSession/gameSessionCardStatus';

/**
 * 一覧に出す「卓」1枚ぶんの表示モデル。
 *
 * **データ側は Lobby と GameSession のまま**（別API・別ステータス）で、
 * ここが UI 表示層でその分離を1つの卓に畳む唯一の場所（#147）。
 * 画面側は Lobby / GameSession を知らず、このモデルだけを見る。
 *
 * 日時・場所は持たせない。一覧のカードには出さない決まりなので、
 * 表示できてしまうデータを載せない（#151）。
 */
export type GameSessionCardModel = {
  /** 卓の同一性はロビーが持つ。v-for の key にも使う */
  lobbyId: string;
  /** 状態の根拠になった開催。まだ開催が無い卓では null */
  gameSessionId: string | null;
  title: string;
  scenarioName: string | null;
  status: GameSessionCardStatus;
  /** 在籍中の人数。脱退者は数えない */
  memberCount: number;
  /** 定員。null なら未設定 */
  maxPlayers: number | null;
  /** 残り枠。定員が未設定なら null（表示しない） */
  remainingCount: number | null;
  /** 自分がホストか */
  isHost: boolean;
  /**
   * 代表になった開催の開催日（`YYYY-MM-DD`）。開催が無い卓では null。
   * 「日程の決まった卓」を開催日の近い順に並べるのに使う。
   */
  scheduledAt: string | null;
  /** 既定の並び替えに使う。新しい順に並べる */
  updatedAt: Date;
};

/**
 * ロビー一覧と開催一覧を突き合わせて、卓カードの配列にする。
 *
 * 開催はロビーに属する（`lobbyId` は NOT NULL）ので、突き合わせは `lobbyId` で行う。
 * どのロビーにも紐づかない開催は返らない前提だが、万一来ても無視される。
 *
 * @param myUserId ログイン中のユーザー ID。未ログインなら null
 */
export const toGameSessionCards = (
  lobbies: LobbyListItemModel[],
  gameSessions: GameSessionListItemModel[],
  myUserId: string | null,
): GameSessionCardModel[] => {
  const sessionsByLobbyId = new Map<string, GameSessionListItemModel[]>();
  for (const session of gameSessions) {
    const bucket = sessionsByLobbyId.get(session.lobbyId);
    if (bucket) {
      bucket.push(session);
    } else {
      sessionsByLobbyId.set(session.lobbyId, [session]);
    }
  }

  const cards = lobbies
    .map((lobby) => {
      const { status, session } = resolveGameSessionCardStatus(
        lobby.status,
        sessionsByLobbyId.get(lobby.id) ?? [],
      );
      const memberCount = lobby.activeEntries.length;

      return {
        lobbyId: lobby.id,
        gameSessionId: session?.id ?? null,
        // 開催が表示値を解決済みで持っているならそちらを優先する
        // （開催ごとの上書きがロビーの値より新しい。design-v2 §5-5）
        title: session?.title ?? lobby.title,
        scenarioName: session?.scenarioName ?? lobby.scenarioName,
        status,
        memberCount,
        maxPlayers: lobby.maxPlayers,
        // 定員を下げた直後などに在籍数が定員を上回りうる。負の残り枠は出さない
        remainingCount:
          lobby.maxPlayers === null
            ? null
            : Math.max(0, lobby.maxPlayers - memberCount),
        isHost: myUserId !== null && lobby.hostUserId === myUserId,
        scheduledAt: session?.scheduledAt ?? null,
        updatedAt: lobby.updatedAt,
      };
    })
    .concat(toOrphanSessionCards(lobbies, gameSessions, myUserId));

  return cards.sort((a, b) => b.updatedAt.getTime() - a.updatedAt.getTime());
};

/** 開催のステータスだけから卓の状態を決める（ロビーが手元に無いとき用） */
const ORPHAN_STATUS: Record<GameSessionStatus, GameSessionCardStatus> = {
  [GameSessionStatus.scheduled]: GameSessionCardStatus.scheduled,
  [GameSessionStatus.today]: GameSessionCardStatus.scheduled,
  [GameSessionStatus.completed]: GameSessionCardStatus.completed,
  [GameSessionStatus.cancelled]: GameSessionCardStatus.cancelled,
};

/**
 * ロビーが手元に無い開催から卓カードを作る。
 *
 * `GET /api/me/lobbies` は**脱退したロビーを返さない**（entry の `leftAt` で除外）
 * のに対し、`GET /api/me/game-sessions` は着席の記録が残っているかぎり開催を返す。
 * ロビー側だけを起点にすると、脱退した卓の履歴が丸ごと消えてしまうため、
 * 突き合わせられなかった開催もカードにして拾う。
 *
 * 定員・在籍人数はロビーが持つ情報なので出せない。着席数だけを人数として見せる。
 */
const toOrphanSessionCards = (
  lobbies: LobbyListItemModel[],
  gameSessions: GameSessionListItemModel[],
  myUserId: string | null,
): GameSessionCardModel[] => {
  const knownLobbyIds = new Set(lobbies.map((l) => l.id));
  const orphans = gameSessions.filter((s) => !knownLobbyIds.has(s.lobbyId));

  // 同じロビーの開催が複数残っていても、卓カードは1枚だけ作る
  const newestByLobbyId = new Map<string, GameSessionListItemModel>();
  for (const session of orphans.sort(byNewestSession)) {
    if (!newestByLobbyId.has(session.lobbyId)) {
      newestByLobbyId.set(session.lobbyId, session);
    }
  }

  return [...newestByLobbyId.values()].map((session) => ({
    lobbyId: session.lobbyId,
    gameSessionId: session.id,
    title: session.title,
    scenarioName: session.scenarioName,
    status: ORPHAN_STATUS[session.status],
    memberCount: session.seatCount,
    maxPlayers: null,
    remainingCount: null,
    isHost: myUserId !== null && session.hostUserId === myUserId,
    scheduledAt: session.scheduledAt,
    updatedAt: session.updatedAt,
  }));
};

/** 終端の状態（もう進まない卓）。マイページの履歴はこの2つをまとめて出す */
const FINISHED_STATUSES: readonly GameSessionCardStatus[] = [
  GameSessionCardStatus.completed,
  GameSessionCardStatus.cancelled,
];

/**
 * 終えた卓（完了・中止）を1つの並びにまとめる。
 *
 * 状態ごとに取って連結すると、**完了が必ず中止より前**に来てしまい、
 * 昨日中止した卓が半年前に完了した卓より下に沈む。履歴として並べるときは
 * 状態をまたいで更新の新しい順にする。
 */
export const toFinishedGameSessionCards = (
  cards: GameSessionCardModel[],
): GameSessionCardModel[] =>
  cards
    .filter((c) => FINISHED_STATUSES.includes(c.status))
    .sort((a, b) => b.updatedAt.getTime() - a.updatedAt.getTime());

/**
 * 状態ごとの並び順。
 *
 * 開催予定は**開催日の近い順**。ロビーの更新日時で並べると、ずっと先の卓が
 * 「ちょっと編集した」だけで明日の卓より前に出てしまう。
 * それ以外は既定どおり更新の新しい順。
 */
export const sortGameSessionCards = (
  cards: GameSessionCardModel[],
  status: GameSessionCardStatus,
): GameSessionCardModel[] => {
  if (status !== GameSessionCardStatus.scheduled) return cards;
  return [...cards].sort((a, b) =>
    (a.scheduledAt ?? '').localeCompare(b.scheduledAt ?? ''),
  );
};
