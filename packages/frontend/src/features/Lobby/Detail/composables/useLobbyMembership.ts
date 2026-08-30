import { computed, getCurrentInstance, onUnmounted, ref, toValue } from 'vue';
import type { MaybeRefOrGetter } from 'vue';
import { LobbyStatus } from '@taku-biyori/shared';
import type { LobbyDetailModel, LobbyEntryModel } from '@/models/lobby';
import { joinLobby, leaveLobby } from '@/api/lobby';
import { useSession } from '@/lib/auth';
import { useToast } from '@/composables/useToast';

export const useLobbyMembership = (
  lobbyId: string,
  // NOTE: 読み取りは getter で受ける。Ref を要求すると props 境界をまたいで
  //       書き換え可能になり、依存の向き（親→子）が壊れるため。
  lobby: MaybeRefOrGetter<LobbyDetailModel | null>,
  // NOTE: 追加されたメンバーの差分反映を呼び出し元に委譲する（join / ゲスト参加後）。
  onMemberAdded: (member: LobbyEntryModel) => void,
  // NOTE: 削除されたメンバーの差分反映を呼び出し元に委譲する（退出・ホスト取り消し後）。
  onMemberRemoved: (memberId: string) => void,
) => {
  // useSession は nanostores の Atom なので Vue の ref に変換する
  const sessionData = ref(useSession.get());
  const unsubscribeSession = useSession.subscribe((v) => {
    sessionData.value = v;
  });
  if (getCurrentInstance()) {
    onUnmounted(() => {
      unsubscribeSession();
    });
  }

  const toast = useToast();
  const loading = ref(false);

  /** ログインユーザーの id */
  const myUserId = computed(() => sessionData.value.data?.user?.id ?? null);

  /** ログインユーザーに対応する在籍中の参加（未参加・脱退済みなら undefined） */
  const myMember = computed(() =>
    toValue(lobby)?.activeEntries.find((e) => e.userId === myUserId.value),
  );

  /** ログインユーザーがこのロビーのメンバーかどうか */
  const isMember = computed(() => !!myMember.value);

  /** ログインユーザーがこのロビーのホストかどうか（hostUserId で判定。entries には含まれない） */
  const isHost = computed(() => toValue(lobby)?.hostUserId === myUserId.value);

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
   * 成功後に onMemberAdded で作成されたメンバーを呼び出し元へ返す。
   * loading 中の重複呼び出しは無視する。
   */
  async function join() {
    if (loading.value) {
      return;
    }
    loading.value = true;
    try {
      const member = await joinLobby(lobbyId, {});
      onMemberAdded(member);
    } catch {
      toast.error('参加に失敗しました');
    } finally {
      loading.value = false;
    }
  }

  /**
   * ロビーから自分自身を退出させる。
   * 成功後に onMemberRemoved で退出した memberId を呼び出し元へ返す。
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
      onMemberRemoved(memberId);
    } catch {
      toast.error('退出に失敗しました');
    } finally {
      loading.value = false;
    }
  }

  /**
   * ホストが指定したメンバーを取り消す。
   * 成功後に onMemberRemoved で取り消した memberId を呼び出し元へ返す。
   * loading 中・canRemoveMember が false のときは何もしない。
   */
  async function removeMember(memberId: string) {
    if (loading.value || !canRemoveMember.value) {
      return;
    }
    loading.value = true;
    try {
      await leaveLobby(lobbyId, memberId);
      onMemberRemoved(memberId);
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
