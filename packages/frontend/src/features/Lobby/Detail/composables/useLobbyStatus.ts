import { computed, ref, toValue } from 'vue';
import type { MaybeRefOrGetter } from 'vue';
import {
  type Lobby,
  type LobbyDetail,
  LobbyAction,
  LobbyStatus,
  canPerformLobbyAction,
} from '@taku-biyori/shared';
import { updateLobbyStatus } from '@/api/lobby';
import { useAuthStore } from '@/stores/auth';
import { useToast } from '@/composables/useToast';

/**
 * 中止ボタンを表示するステータス（UI 仕様）。
 * API 上は draft からの中止も許可される（shared の LOBBY_ACTION_POLICIES 参照）が、
 * 未公開の募集枠に「募集中止」は不自然なため UI では提供しない。
 */
const CANCEL_VISIBLE_STATUSES: LobbyStatus[] = [
  LobbyStatus.open,
  LobbyStatus.scheduling,
];

/**
 * ホストが募集枠のステータスを遷移させる（公開・募集中止）ための composable。
 * 既存の useGameSessionStatus と同じ構成。
 * canXxx の判定は shared の canPerformLobbyAction（API 契約）に委譲し、
 * canCancel のみ UI 仕様で表示ステータスを絞る。
 * 公開・中止は同じステータス遷移 API の呼び出しのため、loading を共有して並行リクエストを防ぐ。
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
   * 公開ボタンを表示できるか。ホストかつ status が draft のときのみ true。
   * 公開は draft → open の一方向のみ（shared の LOBBY_ACTION_POLICIES）。
   */
  const canPublish = computed(() => {
    const current = toValue(lobby);
    if (!current) {
      return false;
    }
    return (
      isHost.value &&
      canPerformLobbyAction(LobbyAction.publishLobby, current.status, 'host')
    );
  });

  /**
   * 編集ボタンを表示できるか。ホストかつ status が draft / open / scheduling のときのみ true。
   * cancelled（中止済み）は編集不可（shared の LOBBY_ACTION_POLICIES）。
   */
  const canEdit = computed(() => {
    const current = toValue(lobby);
    if (!current) {
      return false;
    }
    return (
      isHost.value &&
      canPerformLobbyAction(LobbyAction.editLobby, current.status, 'host')
    );
  });

  /**
   * 中止ボタンを表示できるか。ホストかつ status が open / scheduling のときのみ true。
   * draft は API 上中止可能だが UI では提供しない（CANCEL_VISIBLE_STATUSES 参照）。
   */
  const canCancel = computed(() => {
    const current = toValue(lobby);
    if (!current) {
      return false;
    }
    return isHost.value && CANCEL_VISIBLE_STATUSES.includes(current.status);
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
    canEdit,
    canCancel,
    loading,
    publishLobby,
    cancelLobby,
  };
};
