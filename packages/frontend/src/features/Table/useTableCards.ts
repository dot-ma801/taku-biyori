import { computed, onMounted, ref } from 'vue';
import { listMyLobbies, listPublicLobbies } from '@/api/lobby';
import { listGameSessions } from '@/api/game-session';
import { ApiError } from '@/lib/api-client';
import type { LobbyListItemModel } from '@/models/lobby';
import type { GameSessionListItemModel } from '@/models/game-session';
import { useAuthStore } from '@/stores/auth';
import { toTableCards } from '@/features/Table/toTableCards';
import { TableCardStatus } from '@/features/Table/tableCardStatus';

/**
 * 卓カードの取得。
 *
 * ロビー・開催・公開ロビーを1回だけまとめて取り、`toTableCards` で卓に畳む。
 * 画面（ダッシュボード / 卓一覧）はどちらもこの1つの取得を使うので、
 * セクションやタブが増えてもリクエストは増えない。
 */
export const useTableCards = () => {
  const authStore = useAuthStore();

  const myLobbies = ref<LobbyListItemModel[]>([]);
  const fetchedPublicLobbies = ref<LobbyListItemModel[]>([]);
  const gameSessions = ref<GameSessionListItemModel[]>([]);
  const loading = ref(false);
  const errorMessage = ref('');

  const myUserId = computed(() => authStore.currentUser?.id ?? null);

  /**
   * 自分の卓か（ホスト、または在籍中の参加者）。
   * `GET /api/lobbies` は自分が関わるロビーも公開されていれば返すため、
   * 「さがす」側から自分の卓を取り除くのに使う。
   */
  const isMine = (lobby: LobbyListItemModel): boolean => {
    const userId = myUserId.value;
    if (userId === null) return false;
    return (
      lobby.hostUserId === userId ||
      lobby.activeEntries.some((entry) => entry.userId === userId)
    );
  };

  /** 自分の卓。下書きも含む */
  const cards = computed(() =>
    toTableCards(myLobbies.value, gameSessions.value, myUserId.value),
  );

  /** 下書きを除いた自分の卓。一覧のタブはこちらを使う */
  const activeCards = computed(() =>
    cards.value.filter((c) => c.status !== TableCardStatus.draft),
  );

  /** 下書きの卓。ダッシュボードの1行から辿る導線にだけ使う */
  const draftCards = computed(() =>
    cards.value.filter((c) => c.status === TableCardStatus.draft),
  );

  /**
   * 他の人が募集している卓。
   * **取得時ではなく computed で絞る。** セッション復元を待たずに描画されるため、
   * fetch の時点ではまだ userId が null のことがある。
   */
  const publicCards = computed(() =>
    toTableCards(
      fetchedPublicLobbies.value.filter((l) => !isMine(l)),
      gameSessions.value,
      myUserId.value,
    ),
  );

  const countBy = (status: TableCardStatus) =>
    computed(() => activeCards.value.filter((c) => c.status === status).length);

  /** 指定した状態の卓だけを返す */
  const cardsOf = (status: TableCardStatus) =>
    computed(() => activeCards.value.filter((c) => c.status === status));

  /**
   * 自分のロビーを取る。未ログインなら 401 になるが、公開されている卓は
   * ログイン不要で見せたいのでエラーにせず空で扱う。
   */
  async function fetchMyLobbies(): Promise<LobbyListItemModel[]> {
    try {
      return await listMyLobbies();
    } catch (e) {
      if (e instanceof ApiError && e.status === 401) return [];
      throw e;
    }
  }

  async function fetchGameSessions(): Promise<GameSessionListItemModel[]> {
    try {
      return await listGameSessions();
    } catch (e) {
      if (e instanceof ApiError && e.status === 401) return [];
      throw e;
    }
  }

  async function fetch() {
    loading.value = true;
    errorMessage.value = '';
    try {
      const [mine, sessions, publics] = await Promise.all([
        fetchMyLobbies(),
        fetchGameSessions(),
        listPublicLobbies(),
      ]);
      myLobbies.value = mine;
      gameSessions.value = sessions;
      fetchedPublicLobbies.value = publics;
    } catch {
      errorMessage.value = '卓の一覧を取得できませんでした';
    } finally {
      loading.value = false;
    }
  }

  onMounted(fetch);

  return {
    cards,
    activeCards,
    draftCards,
    publicCards,
    cardsOf,
    countBy,
    loading,
    errorMessage,
    fetch,
  };
};
