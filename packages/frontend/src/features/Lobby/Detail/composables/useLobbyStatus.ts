import { computed, ref, toValue } from 'vue';
import type { MaybeRefOrGetter } from 'vue';
import {
  LobbyAction,
  LobbyStatus,
  canPerformLobbyAction,
} from '@taku-biyori/shared';
import { updateLobbyStatus } from '@/api/lobby';
import type { LobbyDetailModel, LobbyModel } from '@/models/lobby';
import { useAuthStore } from '@/stores/auth';
import { useToast } from '@/composables/useToast';

/**
 * 解散ボタンを表示するステータス（UI 仕様）。
 * API 上は draft からの解散も許可される（shared の LOBBY_ACTION_POLICIES 参照）が、
 * 誰も参加していない下書きに「解散」は不自然なため UI では提供しない。
 */
const DISBAND_VISIBLE_STATUSES: LobbyStatus[] = [
  LobbyStatus.open,
  LobbyStatus.closed,
];

/**
 * ホストがロビーのステータスを遷移させる（公開・受付の開閉・解散）ための composable。
 * 既存の useGameSessionStatus と同じ構成。
 * canXxx の判定は shared の canPerformLobbyAction（API 契約）に委譲し、
 * canDisband のみ UI 仕様で表示ステータスを絞る。
 * 公開・解散は同じステータス遷移 API の呼び出しのため、loading を共有して並行リクエストを防ぐ。
 * 確認ダイアログの表示は UI（.vue）側の責務なので、この composable には持たせない。
 */
export const useLobbyStatus = (
  lobbyId: string,
  lobby: MaybeRefOrGetter<LobbyDetailModel | null>,
  // NOTE: 遷移成功後の更新反映を呼び出し元に委譲する。
  onUpdated: (updated: LobbyModel) => void,
) => {
  const authStore = useAuthStore();
  const toast = useToast();

  /** ステータス遷移（公開・解散）処理中かどうか */
  const loading = ref(false);

  /** ログインユーザーがこのロビーのホストか */
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
   * 編集ボタンを表示できるか。ホストかつ status が draft / open / closed のときのみ true。
   * disbanded（解散済み）は編集不可（shared の LOBBY_ACTION_POLICIES）。
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
   * 解散ボタンを表示できるか。ホストかつ status が open / closed のときのみ true。
   * draft は API 上解散可能だが UI では提供しない（DISBAND_VISIBLE_STATUSES 参照）。
   */
  const canDisband = computed(() => {
    const current = toValue(lobby);
    if (!current) {
      return false;
    }
    return isHost.value && DISBAND_VISIBLE_STATUSES.includes(current.status);
  });

  /**
   * 受付を閉じるボタンを表示できるか。ホストかつ status が open のときのみ true。
   */
  const canCloseReception = computed(() => {
    const current = toValue(lobby);
    if (!current) {
      return false;
    }
    return (
      isHost.value &&
      canPerformLobbyAction(LobbyAction.closeReception, current.status, 'host')
    );
  });

  /**
   * 追加募集（受付を開き直す）ボタンを表示できるか。ホストかつ status が closed のときのみ true。
   */
  const canReopenReception = computed(() => {
    const current = toValue(lobby);
    if (!current) {
      return false;
    }
    return (
      isHost.value &&
      canPerformLobbyAction(LobbyAction.reopenReception, current.status, 'host')
    );
  });

  /**
   * 新しい参加の受付を閉じる（status → closed）。企画自体は続くので、
   * すでに参加している人は日程回答も開催もできる。
   */
  async function closeReception() {
    if (loading.value || !canCloseReception.value) {
      return;
    }
    loading.value = true;
    try {
      const updated = await updateLobbyStatus(lobbyId, { status: 'closed' });
      onUpdated(updated);
      toast.success('受付を終了しました');
    } catch {
      toast.error('受付の終了に失敗しました');
    } finally {
      loading.value = false;
    }
  }

  /**
   * 追加募集する（status → open）。締め切り日が過ぎていればサーバ側でクリアされる。
   */
  async function reopenReception() {
    if (loading.value || !canReopenReception.value) {
      return;
    }
    loading.value = true;
    try {
      const updated = await updateLobbyStatus(lobbyId, { status: 'open' });
      onUpdated(updated);
      toast.success('受付を再開しました');
    } catch {
      toast.error('受付の再開に失敗しました');
    } finally {
      loading.value = false;
    }
  }

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
   * 企画を解散する（status → disbanded）。
   * 成功後に onUpdated で更新後の Lobby を呼び出し元へ返す。
   * 解散不可・loading 中の重複呼び出しは無視する。
   */
  async function disbandLobby() {
    if (loading.value || !canDisband.value) {
      return;
    }
    loading.value = true;
    try {
      const updated = await updateLobbyStatus(lobbyId, {
        status: 'disbanded',
      });
      onUpdated(updated);
      toast.success('企画を解散しました');
    } catch {
      toast.error('解散に失敗しました');
    } finally {
      loading.value = false;
    }
  }

  return {
    isHost,
    canPublish,
    canEdit,
    canCloseReception,
    canReopenReception,
    canDisband,
    loading,
    publishLobby,
    closeReception,
    reopenReception,
    disbandLobby,
  };
};
