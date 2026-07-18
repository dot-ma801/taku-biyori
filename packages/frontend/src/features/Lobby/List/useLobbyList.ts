import { computed, onMounted, ref } from 'vue';
import type { LobbyListItem } from '@taku-biyori/shared';
import { listLobbies } from '@/api/lobby';

export const useLobbyList = () => {
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

  /** 募集枠一覧を取得する */
  async function fetch() {
    loading.value = true;
    errorMessage.value = '';
    try {
      allLobbies.value = await listLobbies();
    } catch {
      errorMessage.value = '募集枠一覧の取得に失敗しました';
    } finally {
      loading.value = false;
    }
  }

  onMounted(fetch);

  return {
    allLobbies,
    publicLobbies,
    myLobbies,
    loading,
    errorMessage,
    fetch,
  };
};
