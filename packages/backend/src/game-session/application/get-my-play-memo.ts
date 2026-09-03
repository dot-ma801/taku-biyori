import type {
  GameSessionPlayMemo,
  MyGameSessionPlayMemo,
} from '@taku-biyori/shared';

export interface GetMyPlayMemoRepository {
  findLobbyId(id: string): Promise<string | null>;
  findSeatByUserId(
    gameSessionId: string,
    userId: string,
  ): Promise<string | null>;
  findPlayMemoBySeatId(seatId: string): Promise<GameSessionPlayMemo | null>;
}

export type GetMyPlayMemoResult =
  | { type: 'ok'; playMemo: MyGameSessionPlayMemo }
  | { type: 'notFound' }
  | { type: 'forbidden' };

/**
 * 自分のプレイメモを取得する（design-v1.2 §5）。
 *
 * 開催のステータスには依存しない。本文の編集は完了・中止で閉じるが、
 * 自分のメモの閲覧は全ステータスで可能（design-v1.2 §4 の操作可否表）。
 */
export const getMyPlayMemo = async (
  repo: GetMyPlayMemoRepository,
  lobbyId: string,
  gameSessionId: string,
  userId: string,
): Promise<GetMyPlayMemoResult> => {
  // URL のロビーがこの開催のロビーでなければ 404（入れ子のパスは親も検証する）
  const actualLobbyId = await repo.findLobbyId(gameSessionId);
  if (actualLobbyId === null || actualLobbyId !== lobbyId) {
    return { type: 'notFound' };
  }

  // 認証ユーザー ID で着席を引く。ゲストは LobbyEntry の user_id = null のため
  // 構造上ヒットせず、ゲスト除外の専用分岐は不要（design-v1.2 §4）
  const seatId = await repo.findSeatByUserId(gameSessionId, userId);
  if (seatId === null) return { type: 'forbidden' };

  const playMemo = await repo.findPlayMemoBySeatId(seatId);
  // 未作成でも 404 にせず空メモを返す。フロントに「エラー」と
  // 「まだ書いていない」の分岐を作らせない（design-v1.2 §8）
  return {
    type: 'ok',
    playMemo: playMemo ?? {
      seatId,
      body: '',
      sharedAt: null,
      updatedAt: null,
    },
  };
};
