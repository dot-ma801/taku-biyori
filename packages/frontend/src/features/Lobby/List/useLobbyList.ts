import { computed, getCurrentInstance, onMounted, onUnmounted, ref } from 'vue';
import type { LobbyStatus } from '@taku-biyori/shared';
import { listLobbies } from '@/api/lobby';
import type { LobbyListItemModel } from '@/models/lobby';
import { useSession } from '@/lib/auth';

export const useLobbyList = (statuses?: LobbyStatus[]) => {
  /** 全募集枠 */
  const allLobbies = ref<LobbyListItemModel[]>([]);

  /** 取得中かどうか */
  const loading = ref(false);

  /** エラーメッセージ */
  const errorMessage = ref('');

  // useSession は nanostores の Atom なので Vue の ref に変換する
  const sessionData = ref(useSession.get());
  const unsubscribeSession = useSession.subscribe((v) => {
    sessionData.value = v;
  });
  if (getCurrentInstance()) {
    onUnmounted(unsubscribeSession);
  }

  const myUserId = computed(() => sessionData.value.data?.user?.id ?? null);

  /**
   * 自分のロビーか（ホスト、または在籍中の参加者）。
   * v0.2 の `role` を置き換えた判定。誰がホストかを捨てずに済む（design-v2 §6-13）
   */
  const isMine = (lobby: LobbyListItemModel): boolean => {
    const userId = myUserId.value;
    if (userId === null) return false;
    return (
      lobby.hostUserId === userId ||
      lobby.activeEntries.some((entry) => entry.userId === userId)
    );
  };

  const publicLobbies = computed(() =>
    allLobbies.value.filter((l) => !isMine(l)),
  );

  const myLobbies = computed(() => allLobbies.value.filter(isMine));

  /** 自分のロビーのうち statuses に該当するもの（未指定時は myLobbies をそのまま返す） */
  const filteredMyLobbies = computed(() => {
    if (statuses === undefined) return myLobbies.value;
    return myLobbies.value.filter((l) => statuses.includes(l.status));
  });

  /** 公開ロビーのうち statuses に該当するもの（未指定時は publicLobbies をそのまま返す） */
  const filteredPublicLobbies = computed(() => {
    if (statuses === undefined) return publicLobbies.value;
    return publicLobbies.value.filter((l) => statuses.includes(l.status));
  });

  /**
   * 絞り込み後に表示する募集枠が1件でもあるか。
   * セクションごと非表示にしたい呼び出し側（ダッシュボードの「非公開のロビー」など）が使う。
   */
  const hasFilteredLobbies = computed(
    () =>
      filteredMyLobbies.value.length > 0 ||
      filteredPublicLobbies.value.length > 0,
  );

  /** 募集枠一覧を取得する */
  async function fetch() {
    loading.value = true;
    errorMessage.value = '';
    try {
      allLobbies.value = await listLobbies();
    } catch {
      errorMessage.value = 'ロビー一覧の取得に失敗しました';
    } finally {
      loading.value = false;
    }
  }

  onMounted(fetch);

  return {
    allLobbies,
    publicLobbies,
    myLobbies,
    filteredMyLobbies,
    filteredPublicLobbies,
    hasFilteredLobbies,
    loading,
    errorMessage,
    fetch,
  };
};
