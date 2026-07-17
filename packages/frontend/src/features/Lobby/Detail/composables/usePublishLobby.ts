import { computed, ref, toValue } from 'vue';
import type { MaybeRefOrGetter } from 'vue';
import type { Lobby, LobbyDetail } from '@taku-biyori/shared';
import { LobbyStatus } from '@taku-biyori/shared';
import { updateLobbyStatus } from '@/api/lobby';
import { useAuthStore } from '@/stores/auth';
import { useToast } from '@/composables/useToast';

/** 公開（open）への遷移がバックエンドで許可されているステータス */
const PUBLISHABLE_STATUSES: LobbyStatus[] = [LobbyStatus.draft];

/**
 * ホストが募集を公開するための composable。
 * 確認ダイアログの表示は UI（.vue）側の責務なので、この composable には持たせない。
 */
export const usePublishLobby = (
  lobbyId: string,
  lobby: MaybeRefOrGetter<LobbyDetail | null>,
  // NOTE: 公開成功後の更新反映を呼び出し元に委譲する。
  onPublished: (updated: Lobby) => void,
) => {
  const authStore = useAuthStore();
  const toast = useToast();

  /** 公開処理中かどうか */
  const loading = ref(false);

  /** ログインユーザーがこの募集枠のホストか */
  const isHost = computed(() => {
    const current = toValue(lobby);
    return !!current && current.hostUserId === authStore.currentUser?.id;
  });

  /**
   * 公開可能か。ホストかつ status が draft のときのみ true。
   * open / scheduling / confirmed / cancelled からの公開は不可（update-lobby-status の遷移制約。
   * 公開は draft → open の一方向のみ）。
   */
  const canPublish = computed(() => {
    const current = toValue(lobby);
    if (!current) {
      return false;
    }
    return isHost.value && PUBLISHABLE_STATUSES.includes(current.status);
  });

  /**
   * 募集を公開する（status → open）。
   * 成功後に onPublished で更新後の Lobby を呼び出し元へ返す。
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
      onPublished(updated);
      toast.success('募集を公開しました');
    } catch {
      toast.error('募集の公開に失敗しました');
    } finally {
      loading.value = false;
    }
  }

  return {
    isHost,
    canPublish,
    loading,
    publishLobby,
  };
};
