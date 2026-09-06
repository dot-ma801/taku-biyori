import { onMounted, ref, toValue, watch, type MaybeRefOrGetter } from 'vue';
import { getGameSession } from '@/api/game-session';
import { ApiError } from '@/lib/api-client';
import type { GameSessionDetailModel, SeatModel } from '@/models/game-session';

/**
 * 開催の詳細を取得して保持する。**この状態の所有者**。
 *
 * 子（着席の編集・ステータス操作）は値を props で受け取り、更新は callback で
 * ここへ返す。書き込みの向きを「呼び出し側 → composable」の一方向に保つ（CLAUDE.md）。
 */
export const useGetGameSessionDetail = (
  lobbyId: string,
  // 卓詳細は「ロビー配下のどの開催を見せるか」を取得後に決めるため、
  // id が後から決まる（= 最初は null）呼び出しも受け付ける。
  gameSessionId: MaybeRefOrGetter<string | null>,
) => {
  const gameSession = ref<GameSessionDetailModel | null>(null);
  const loading = ref(false);
  const errorMessage = ref('');

  async function fetch() {
    const id = toValue(gameSessionId);
    // 開催がまだ無い卓。取りに行かず「開催なし」のまま置く
    if (id === null) {
      gameSession.value = null;
      return;
    }

    loading.value = true;
    errorMessage.value = '';

    try {
      gameSession.value = await getGameSession(lobbyId, id);
    } catch (err) {
      errorMessage.value =
        err instanceof ApiError ? err.message : 'エラーが発生しました';
    } finally {
      loading.value = false;
    }
  }

  onMounted(fetch);

  // 代表になる開催が後から決まる／切り替わったら取り直す。
  // immediate にしないのは、初回を onMounted に一本化しておくため
  watch(
    () => toValue(gameSessionId),
    () => {
      void fetch();
    },
  );

  /** 変化したフィールドだけを差し替える */
  function patchGameSession(patch: Partial<GameSessionDetailModel>) {
    if (gameSession.value) {
      gameSession.value = { ...gameSession.value, ...patch };
    }
  }

  // seats の加工は所有者であるこの composable に集約する。
  // 子 composable は callback でこれらを呼ぶだけ（書き込みは親に一方向）。

  /** 着席を追加する */
  function addSeat(seat: SeatModel) {
    if (!gameSession.value) return;
    patchGameSession({ seats: [...gameSession.value.seats, seat] });
  }

  /** 着席を取り除く（離席） */
  function removeSeat(seatId: string) {
    if (!gameSession.value) return;
    patchGameSession({
      seats: gameSession.value.seats.filter((seat) => seat.id !== seatId),
    });
  }

  /** 既存の着席を差し替える（キャラクター名の編集など） */
  function updateSeat(updated: SeatModel) {
    if (!gameSession.value) return;
    patchGameSession({
      seats: gameSession.value.seats.map((seat) =>
        seat.id === updated.id ? updated : seat,
      ),
    });
  }

  return {
    gameSession,
    loading,
    errorMessage,
    fetch,
    patchGameSession,
    addSeat,
    removeSeat,
    updateSeat,
  };
};
