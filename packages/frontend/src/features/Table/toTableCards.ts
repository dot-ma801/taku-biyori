import { GameSessionStatus, LobbyStatus } from '@taku-biyori/shared';
import type { LobbyListItemModel } from '@/models/lobby';
import type { GameSessionListItemModel } from '@/models/game-session';
import { TableCardStatus } from '@/features/Table/tableCardStatus';

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
export type TableCardModel = {
  /** 卓の同一性はロビーが持つ。v-for の key にも使う */
  lobbyId: string;
  /** 状態の根拠になった開催。まだ開催が無い卓では null */
  gameSessionId: string | null;
  title: string;
  scenarioName: string | null;
  status: TableCardStatus;
  /** 在籍中の人数。脱退者は数えない */
  memberCount: number;
  /** 定員。null なら未設定 */
  maxPlayers: number | null;
  /** 残り枠。定員が未設定なら null（表示しない） */
  remainingCount: number | null;
  /** 自分がホストか */
  isHost: boolean;
  /** 一覧の並び替えに使う。新しい順に並べる */
  updatedAt: Date;
};

/** 進行中の開催（この卓の「いま」を決める） */
const LIVE_SESSION_STATUSES: readonly GameSessionStatus[] = [
  GameSessionStatus.scheduled,
  GameSessionStatus.today,
];

/**
 * 開催の新しさ。開催日が新しいものを優先し、同日なら後から作ったほうを採る。
 *
 * 1つのロビーから複数の開催が生まれているケースでも、卓カードは常に
 * 「いちばん新しい開催」を代表として1枚だけ出す。
 */
const byNewest = (
  a: GameSessionListItemModel,
  b: GameSessionListItemModel,
): number =>
  b.scheduledAt.localeCompare(a.scheduledAt) ||
  b.createdAt.getTime() - a.createdAt.getTime();

const pickNewest = (
  sessions: GameSessionListItemModel[],
  statuses: readonly GameSessionStatus[],
): GameSessionListItemModel | null =>
  sessions.filter((s) => statuses.includes(s.status)).sort(byNewest)[0] ?? null;

/**
 * ロビーと、そのロビーに属する開催から卓の状態を決める。
 *
 * 優先順位:
 * 1. 下書きのロビーは `draft`（系列の外）
 * 2. 解散したロビーは `cancelled`。企画そのものが畳まれている
 * 3. 進行中の開催があれば `scheduled`
 * 4. 完了した開催があれば `completed`
 * 5. どちらも無ければロビーの受付状態で決める（受付中なら `recruiting`、
 *    締めていれば `adjusting`）
 *
 * 中止された開催しか無い卓が 5 に落ちるのは意図どおり。開催をやめても
 * ロビーが生きているなら、その卓はまた日程調整からやり直す状態に戻る。
 */
const resolveStatus = (
  lobby: LobbyListItemModel,
  sessions: GameSessionListItemModel[],
): { status: TableCardStatus; session: GameSessionListItemModel | null } => {
  if (lobby.status === LobbyStatus.draft) {
    return { status: TableCardStatus.draft, session: null };
  }
  if (lobby.status === LobbyStatus.disbanded) {
    return { status: TableCardStatus.cancelled, session: null };
  }

  const live = pickNewest(sessions, LIVE_SESSION_STATUSES);
  if (live !== null) {
    return { status: TableCardStatus.scheduled, session: live };
  }

  const completed = pickNewest(sessions, [GameSessionStatus.completed]);
  if (completed !== null) {
    return { status: TableCardStatus.completed, session: completed };
  }

  return {
    status:
      lobby.status === LobbyStatus.open
        ? TableCardStatus.recruiting
        : TableCardStatus.adjusting,
    session: null,
  };
};

/**
 * ロビー一覧と開催一覧を突き合わせて、卓カードの配列にする。
 *
 * 開催はロビーに属する（`lobbyId` は NOT NULL）ので、突き合わせは `lobbyId` で行う。
 * どのロビーにも紐づかない開催は返らない前提だが、万一来ても無視される。
 *
 * @param myUserId ログイン中のユーザー ID。未ログインなら null
 */
export const toTableCards = (
  lobbies: LobbyListItemModel[],
  gameSessions: GameSessionListItemModel[],
  myUserId: string | null,
): TableCardModel[] => {
  const sessionsByLobbyId = new Map<string, GameSessionListItemModel[]>();
  for (const session of gameSessions) {
    const bucket = sessionsByLobbyId.get(session.lobbyId);
    if (bucket) {
      bucket.push(session);
    } else {
      sessionsByLobbyId.set(session.lobbyId, [session]);
    }
  }

  return lobbies
    .map((lobby) => {
      const { status, session } = resolveStatus(
        lobby,
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
        updatedAt: lobby.updatedAt,
      };
    })
    .sort((a, b) => b.updatedAt.getTime() - a.updatedAt.getTime());
};
