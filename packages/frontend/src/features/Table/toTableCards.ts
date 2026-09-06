import type { LobbyListItemModel } from '@/models/lobby';
import type { GameSessionListItemModel } from '@/models/game-session';
import { resolveTableStatus } from '@/features/Table/resolveTableStatus';
import type { TableCardStatus } from '@/features/Table/tableCardStatus';

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
      const { status, session } = resolveTableStatus(
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
        updatedAt: lobby.updatedAt,
      };
    })
    .sort((a, b) => b.updatedAt.getTime() - a.updatedAt.getTime());
};
