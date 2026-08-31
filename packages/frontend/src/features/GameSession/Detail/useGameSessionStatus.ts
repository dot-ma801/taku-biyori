import { computed, ref, toValue } from 'vue';
import type { MaybeRefOrGetter } from 'vue';
import { useRouter } from 'vue-router';
import { GameSessionAction, canPerform } from '@taku-biyori/shared';
import type { GameSessionDetailModel } from '@/models/game-session';
import { deleteGameSession, updateGameSessionStatus } from '@/api/game-session';
import { useAuthStore } from '@/stores/auth';
import { useToast } from '@/composables/useToast';

/**
 * 開催のステータス操作（完了・中止・削除）。
 *
 * 可否の判定は shared のポリシー表に委ねる。ここに条件をハードコードしない
 * （backend のバリデーションと同じ表を使う。design-v2 §4-5）。
 * 表で表せない条件（削除の「着席者がホストのみ」）だけをここで足す。
 */
export const useGameSessionStatus = (
  lobbyId: string,
  gameSessionId: string,
  gameSession: MaybeRefOrGetter<GameSessionDetailModel | null>,
  // 変更後の再取得は呼び出し元に委譲する
  onRefresh: () => void,
) => {
  const authStore = useAuthStore();
  const toast = useToast();
  const router = useRouter();

  /** ステータス遷移の処理中かどうか */
  const loading = ref(false);
  /** 削除処理中かどうか。ステータス遷移とは独立して扱う */
  const loadingDelete = ref(false);

  /** ログインユーザーがこの開催のホストか。ホストはロビーが持つ（design-v2 §3-7） */
  const isHost = computed(() => {
    const session = toValue(gameSession);
    return !!session && session.lobby.hostUserId === authStore.currentUser?.id;
  });

  const allows = (action: GameSessionAction): boolean => {
    const session = toValue(gameSession);
    if (!session || !isHost.value) return false;
    return canPerform(action, session.status, 'host');
  };

  const canComplete = computed(() =>
    allows(GameSessionAction.completeGameSession),
  );
  const canCancel = computed(() => allows(GameSessionAction.cancelGameSession));
  const canEdit = computed(() => allows(GameSessionAction.editGameSession));

  /**
   * 削除可能か。「`cancelled`」**または**「着席者がホスト本人のみ」（design-v2 §4-3）。
   * 前半はポリシー表が持ち、後半は件数条件なのでここで足す（§4-5）。
   */
  const canDelete = computed(() => {
    const session = toValue(gameSession);
    if (!session || !isHost.value) return false;
    if (allows(GameSessionAction.deleteGameSession)) return true;

    const myUserId = authStore.currentUser?.id;
    const others = session.seats.filter((seat) => seat.userId !== myUserId);
    return others.length === 0;
  });

  const isBusy = (): boolean => loading.value || loadingDelete.value;

  async function completeGameSession() {
    if (isBusy() || !canComplete.value) return;
    loading.value = true;
    try {
      await updateGameSessionStatus(lobbyId, gameSessionId, {
        status: 'completed',
      });
      onRefresh();
    } catch {
      toast.error('完了への変更に失敗しました');
    } finally {
      loading.value = false;
    }
  }

  async function cancelGameSession() {
    if (isBusy() || !canCancel.value) return;
    loading.value = true;
    try {
      await updateGameSessionStatus(lobbyId, gameSessionId, {
        status: 'cancelled',
      });
      onRefresh();
    } catch {
      toast.error('開催の中止に失敗しました');
    } finally {
      loading.value = false;
    }
  }

  /** 削除後はロビー詳細へ戻る。開催はロビーに属するので一覧はそちらにある */
  async function removeGameSession() {
    if (isBusy() || !canDelete.value) return;
    loadingDelete.value = true;
    try {
      await deleteGameSession(lobbyId, gameSessionId);
    } catch {
      toast.error('開催の削除に失敗しました');
      return;
    } finally {
      loadingDelete.value = false;
    }
    toast.success('開催を削除しました');
    await router.push({ name: 'lobbies-detail', params: { lobbyId } });
  }

  return {
    isHost,
    canComplete,
    canCancel,
    canEdit,
    canDelete,
    loading,
    loadingDelete,
    completeGameSession,
    cancelGameSession,
    removeGameSession,
  };
};
