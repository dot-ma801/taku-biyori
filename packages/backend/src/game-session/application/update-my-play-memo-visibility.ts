import type {
  GameSessionPlayMemo,
  UpdateGameSessionPlayMemoVisibilityInput,
} from '@taku-biyori/shared';

export interface UpdateMyPlayMemoVisibilityRepository {
  findLobbyId(id: string): Promise<string | null>;
  findSeatByUserId(
    gameSessionId: string,
    userId: string,
  ): Promise<string | null>;
  updatePlayMemoVisibility(
    seatId: string,
    sharedAt: Date | null,
  ): Promise<GameSessionPlayMemo | null>;
}

export type UpdateMyPlayMemoVisibilityResult =
  | { type: 'ok'; playMemo: GameSessionPlayMemo }
  | { type: 'notFound' }
  | { type: 'forbidden' };

/**
 * 自分のプレイメモの公開・非公開を切り替える（design-v1.2 §5）。
 *
 * 本文の編集と違い**全ステータスで許可する**。完了・中止後こそ「遊んだ後に公開する」
 * ために使われる操作であるため（design-v2 §4-3「プレイメモの公開切替 / 常時」）。
 * ステータス非依存であることを、ステータスを読まないことで表現している。
 */
export const updateMyPlayMemoVisibility = async (
  repo: UpdateMyPlayMemoVisibilityRepository,
  lobbyId: string,
  gameSessionId: string,
  userId: string,
  input: UpdateGameSessionPlayMemoVisibilityInput,
  now: Date = new Date(),
): Promise<UpdateMyPlayMemoVisibilityResult> => {
  // URL のロビーがこの開催のロビーでなければ 404（入れ子のパスは親も検証する）
  const actualLobbyId = await repo.findLobbyId(gameSessionId);
  if (actualLobbyId === null || actualLobbyId !== lobbyId) {
    return { type: 'notFound' };
  }

  // 認証ユーザー ID で着席を引く。ゲストは LobbyEntry の user_id = null のため
  // 構造上ヒットせず、ゲスト除外の専用分岐は不要（design-v1.2 §4）
  const seatId = await repo.findSeatByUserId(gameSessionId, userId);
  if (seatId === null) return { type: 'forbidden' };

  const playMemo = await repo.updatePlayMemoVisibility(
    seatId,
    input.shared ? now : null,
  );
  // 本文を一度も保存していないメモを公開する意味がないため 404 にする（design-v1.2 §5）
  if (playMemo === null) return { type: 'notFound' };

  return { type: 'ok', playMemo };
};
