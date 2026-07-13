import { computed, ref, toValue } from 'vue';
import type { MaybeRefOrGetter } from 'vue';
import type { Lobby, LobbyDetail } from '@taku-biyori/shared';
import { LobbyStatus } from '@taku-biyori/shared';
import { updateLobbyStatus } from '@/api/lobby';
import { useAuthStore } from '@/stores/auth';
import { useToast } from '@/composables/useToast';

/** 中止（cancelled）への遷移がバックエンドで許可されているステータス */
const CANCELLABLE_STATUSES: LobbyStatus[] = [
  LobbyStatus.draft,
  LobbyStatus.open,
  LobbyStatus.scheduling,
];

/**
 * ホストが募集を中止するための composable。
 * 確認ダイアログの表示は UI（.vue）側の責務なので、この composable には持たせない。
 */
export const useCancelLobby = (
  lobbyId: string,
  lobby: MaybeRefOrGetter<LobbyDetail | null>,
  // NOTE: 中止成功後の更新反映を呼び出し元に委譲する。
  onCancelled: (updated: Lobby) => void,
) => {
  const authStore = useAuthStore();
  const toast = useToast();

  /** 募集中止処理中かどうか */
  const loading = ref(false);

  /** ログインユーザーがこの募集枠のホストか */
  const isHost = computed(() => {
    const current = toValue(lobby);
    return !!current && current.hostUserId === authStore.currentUser?.id;
  });

  /**
   * 中止可能か。ホストかつ status が draft / open / scheduling のいずれかのときのみ true。
   * confirmed（卓確定済み）・cancelled（中止済み）からの中止は不可（update-lobby-status の遷移制約）。
   */
  const canCancel = computed(() => {
    const current = toValue(lobby);
    if (!current) {
      return false;
    }
    return isHost.value && CANCELLABLE_STATUSES.includes(current.status);
  });

  /**
   * 募集を中止する（status → cancelled）。
   * 成功後に onCancelled で更新後の Lobby を呼び出し元へ返す。
   * 中止不可・loading 中の重複呼び出しは無視する。
   */
  async function cancelLobby() {
    if (loading.value || !canCancel.value) {
      return;
    }
    loading.value = true;
    try {
      const updated = await updateLobbyStatus(lobbyId, {
        status: 'cancelled',
      });
      onCancelled(updated);
      toast.success('募集を中止しました');
    } catch {
      toast.error('募集の中止に失敗しました');
    } finally {
      loading.value = false;
    }
  }

  return {
    isHost,
    canCancel,
    loading,
    cancelLobby,
  };
};
