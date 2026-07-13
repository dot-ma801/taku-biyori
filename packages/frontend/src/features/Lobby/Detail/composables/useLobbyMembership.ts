import { computed, ref, toValue } from 'vue';
import type { MaybeRefOrGetter } from 'vue';
import type { LobbyDetail } from '@taku-biyori/shared';
import { LobbyStatus } from '@taku-biyori/shared';
import { joinLobby, leaveLobby } from '@/api/lobby';
import { useAuthStore } from '@/stores/auth';
import { useToast } from '@/composables/useToast';

export const useLobbyMembership = (
  lobbyId: string,
  // NOTE: 読み取りは getter で受ける。Ref を要求すると props 境界をまたいで
  //       書き換え可能になり、依存の向き（親→子）が壊れるため。
  lobby: MaybeRefOrGetter<LobbyDetail | null>,
  // NOTE: 変更後の再取得を呼び出し元に委譲する。
  onRefresh: () => void,
) => {
  const authStore = useAuthStore();
  const toast = useToast();
  const loading = ref(false);

  /** ログインユーザーに対応する members 内のエントリ（未参加なら undefined） */
  const myMember = computed(() =>
    toValue(lobby)?.members.find((m) => m.userId === authStore.currentUser?.id),
  );

  /** ログインユーザーがこのロビーのメンバーかどうか */
  const isMember = computed(() => !!myMember.value);

  /** ログインユーザーがこのロビーのホストかどうか（hostUserId で判定。members には含まれない） */
  const isHost = computed(
    () => toValue(lobby)?.hostUserId === authStore.currentUser?.id,
  );

  /** 参加可能かどうか。ホストでなく・未参加で・募集中（open）のときのみ true */
  const canJoin = computed(
    () =>
      !isHost.value &&
      !isMember.value &&
      toValue(lobby)?.status === LobbyStatus.open,
  );

  /** 退出可能かどうか。メンバーかつホストでなく・open または scheduling のときのみ true */
  const canLeave = computed(() => {
    const status = toValue(lobby)?.status;
    return (
      isMember.value &&
      !isHost.value &&
      (status === LobbyStatus.open || status === LobbyStatus.scheduling)
    );
  });

  /** ホストがメンバーを取り消せるかどうか。ホストかつ open または scheduling のときのみ true */
  const canRemoveMember = computed(() => {
    const status = toValue(lobby)?.status;
    return (
      isHost.value &&
      (status === LobbyStatus.open || status === LobbyStatus.scheduling)
    );
  });

  /**
   * ロビーに参加する。
   * 成功後に onRefresh を呼び出す。
   * loading 中の重複呼び出しは無視する。
   */
  async function join() {
    if (loading.value) {
      return;
    }
    loading.value = true;
    try {
      await joinLobby(lobbyId, {});
      onRefresh();
    } catch {
      toast.error('参加に失敗しました');
    } finally {
      loading.value = false;
    }
  }

  /**
   * ロビーから自分自身を退出させる。
   * 成功後に onRefresh を呼び出す。
   * loading 中・未参加時の呼び出しは無視する。
   */
  async function leave() {
    if (loading.value || !myMember.value) {
      return;
    }
    loading.value = true;
    const memberId = myMember.value.id;
    try {
      await leaveLobby(lobbyId, memberId);
      onRefresh();
    } catch {
      toast.error('退出に失敗しました');
    } finally {
      loading.value = false;
    }
  }

  /**
   * ホストが指定したメンバーを取り消す。
   * 成功後に onRefresh を呼び出す。
   * loading 中・canRemoveMember が false のときは何もしない。
   */
  async function removeMember(memberId: string) {
    if (loading.value || !canRemoveMember.value) {
      return;
    }
    loading.value = true;
    try {
      await leaveLobby(lobbyId, memberId);
      onRefresh();
    } catch {
      toast.error('メンバーの取り消しに失敗しました');
    } finally {
      loading.value = false;
    }
  }

  return {
    myMember,
    isMember,
    isHost,
    canJoin,
    canLeave,
    canRemoveMember,
    loading,
    join,
    leave,
    removeMember,
  };
};
