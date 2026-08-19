import { computed, ref, toValue, watch } from 'vue';
import type { MaybeRefOrGetter } from 'vue';
import type { LobbyMember, LobbyMemberLinkRequest } from '@taku-biyori/shared';
import {
  listLobbyMemberLinkRequests,
  approveLobbyMemberLink,
  deleteLobbyMemberLinkRequest,
} from '@/api/lobby';
import { useToast } from '@/composables/useToast';

/**
 * ゲスト紐づけ申請をホストが承認・却下するための composable（ADR 0008）。
 *
 * 本人確認の手段がないため、承認はホストの人間的な判断に委ねる設計になっている。
 * 誰がどのゲストとして名乗り出ているかを一覧で示し、ホストが可否を決める。
 */
export const useMemberLinkApproval = (
  lobbyId: string,
  // NOTE: 読み取りは getter で受ける。
  isHost: MaybeRefOrGetter<boolean>,
  // NOTE: 紐づけ後のメンバー反映は所有者（親）に委譲する。
  onApproved: (member: LobbyMember) => void,
) => {
  const toast = useToast();
  const loading = ref(false);

  /** 承認待ちの申請。この composable が所有する */
  const requests = ref<LobbyMemberLinkRequest[]>([]);

  const hasRequests = computed(() => requests.value.length > 0);

  function removeRequest(requestId: string) {
    requests.value = requests.value.filter((r) => r.id !== requestId);
  }

  /** 申請一覧を取得する。ホスト以外は 403 になるため呼び出さない */
  async function load() {
    if (!toValue(isHost)) return;

    try {
      requests.value = await listLobbyMemberLinkRequests(lobbyId);
    } catch {
      // 一覧は補助的な情報なので、取得失敗で画面全体を止めない
      requests.value = [];
    }
  }

  /** 申請を承認してゲスト行にアカウントを結び付ける */
  async function approve(requestId: string) {
    if (loading.value) return;

    loading.value = true;
    try {
      const member = await approveLobbyMemberLink(lobbyId, requestId);
      removeRequest(requestId);
      onApproved(member);
      toast.success('参加者を紐づけました');
    } catch {
      // 既に同じユーザーが参加済みの場合など（409）
      toast.error('紐づけに失敗しました。既に参加していないか確認してください');
    } finally {
      loading.value = false;
    }
  }

  /** 申請を却下する */
  async function reject(requestId: string) {
    if (loading.value) return;

    loading.value = true;
    try {
      await deleteLobbyMemberLinkRequest(lobbyId, requestId);
      removeRequest(requestId);
      toast.success('申請を却下しました');
    } catch {
      toast.error('却下に失敗しました');
    } finally {
      loading.value = false;
    }
  }

  // ホスト判定はセッション取得の完了後に確定することがある。
  // マウント時に一度だけ読むと未確定のまま素通りするため、true になった時点で取得する。
  watch(() => toValue(isHost), (host) => {
    if (host) void load();
  }, { immediate: true });

  return {
    requests,
    hasRequests,
    loading,
    load,
    approve,
    reject,
  };
};
