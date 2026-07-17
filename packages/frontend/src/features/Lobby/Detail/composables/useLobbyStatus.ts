import { computed, ref, toValue } from 'vue';
import type { MaybeRefOrGetter } from 'vue';
import type { Lobby, LobbyDetail } from '@taku-biyori/shared';
import { LobbyStatus } from '@taku-biyori/shared';
import { updateLobbyStatus } from '@/api/lobby';
import { useAuthStore } from '@/stores/auth';
import { useToast } from '@/composables/useToast';

/** 公開（open）への遷移がバックエンドで許可されているステータス */
const PUBLISHABLE_STATUSES: LobbyStatus[] = [LobbyStatus.draft];

/** 中止（cancelled）への遷移がバックエンドで許可されているステータス */
const CANCELLABLE_STATUSES: LobbyStatus[] = [
  LobbyStatus.draft,
  LobbyStatus.open,
  LobbyStatus.scheduling,
];

/**
 * ホストが募集枠のステータスを遷移させる（公開・募集中止）ための composable。
 * 既存の useGameSessionStatus と同じ構成。
 * draft では公開・中止の両方が可能なため、loading を共有して並行リクエストを防ぐ。
 * 確認ダイアログの表示は UI（.vue）側の責務なので、この composable には持たせない。
 */
export const useLobbyStatus = (
  lobbyId: string,
  lobby: MaybeRefOrGetter<LobbyDetail | null>,
  // NOTE: 遷移成功後の更新反映を呼び出し元に委譲する。
  onUpdated: (updated: Lobby) => void,
) => {
  const authStore = useAuthStore();
  const toast = useToast();

  /** ステータス遷移（公開・募集中止）処理中かどうか */
  const loading = ref(false);

  /** ログインユーザーがこの募集枠のホストか */
  const isHost = computed(() => {
    const current = toValue(lobby);
    return !!current && current.hostUserId === authStore.currentUser?.id;
  });

  /**
   * 公開可能か。ホストかつ status が draft のときのみ true。
   * 公開は draft → open の一方向のみ（update-lobby-status の遷移制約）。
   */
  const canPublish = computed(() => {
    const current = toValue(lobby);
    if (!current) {
      return false;
    }
    return isHost.value && PUBLISHABLE_STATUSES.includes(current.status);
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
   * 募集を公開する（status → open）。
   * 成功後に onUpdated で更新後の Lobby を呼び出し元へ返す。
   * 公開不可・loading 中の重複呼び出しは無視する。
   */
  async function publishLobby() {
    if (loading.value || !canPublish.value) {
      return;
    }
    loading.value = true;
    try {
      const updated = await updateLobbyStatus(lobbyId, {
        status: 'open',
      });
      onUpdated(updated);
      toast.success('募集を公開しました');
    } catch {
      toast.error('募集の公開に失敗しました');
    } finally {
      loading.value = false;
    }
  }

  /**
   * 募集を中止する（status → cancelled）。
   * 成功後に onUpdated で更新後の Lobby を呼び出し元へ返す。
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
      onUpdated(updated);
      toast.success('募集を中止しました');
    } catch {
      toast.error('募集の中止に失敗しました');
    } finally {
      loading.value = false;
    }
  }

  return {
    isHost,
    canPublish,
    canCancel,
    loading,
    publishLobby,
    cancelLobby,
  };
};
