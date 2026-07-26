import { computed, onMounted, ref } from 'vue';
import type { LobbyListItem } from '@taku-biyori/shared';
import type { LobbyStatus } from '@taku-biyori/shared';
import { listLobbies } from '@/api/lobby';

export const useLobbyList = (statuses?: LobbyStatus[]) => {
  /** 全募集枠（APIレスポンスそのまま） */
  const allLobbies = ref<LobbyListItem[]>([]);

  /** 取得中かどうか */
  const loading = ref(false);

  /** エラーメッセージ */
  const errorMessage = ref('');

  const publicLobbies = computed(() =>
    allLobbies.value.filter((l) => l.role === null),
  );

  const myLobbies = computed(() =>
    allLobbies.value.filter((l) => l.role !== null),
  );

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
