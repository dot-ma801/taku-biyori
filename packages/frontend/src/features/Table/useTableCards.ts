import { computed, onMounted, ref } from 'vue';
import { listMyLobbies, listPublicLobbies } from '@/api/lobby';
import { listGameSessions, listLobbyGameSessions } from '@/api/game-session';
import { ApiError } from '@/lib/api-client';
import type { LobbyListItemModel } from '@/models/lobby';
import type { GameSessionListItemModel } from '@/models/game-session';
import { useAuthStore } from '@/stores/auth';
import { sortTableCards, toTableCards } from '@/features/Table/toTableCards';
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
   *
   * 開催は渡さない。`GET /api/me/game-sessions` は自分がホスト or 着席済みの
   * 開催しか返さないので、他人の卓に混ぜると「開催が無い」と誤って解決してしまう。
   * `GET /api/lobbies` 自体が受付中のロビーだけを返すため、ここは常に募集中でよい。
   */
  const publicCards = computed(() =>
    toTableCards(
      fetchedPublicLobbies.value.filter((l) => !isMine(l)),
      [],
      myUserId.value,
    ),
  );

  const countBy = (status: TableCardStatus) =>
    computed(() => activeCards.value.filter((c) => c.status === status).length);

  /** 指定した状態の卓だけを、その状態に合った並び順で返す */
  const cardsOf = (status: TableCardStatus) =>
    computed(() =>
      sortTableCards(
        activeCards.value.filter((c) => c.status === status),
        status,
      ),
    );

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

  /**
   * 着席していないメンバーの卓を補う。
   *
   * `GET /api/me/game-sessions` が返すのは「自分がホスト or 着席済み」の開催だけ。
   * 確定日に参加できず着席していないメンバーは開催を受け取れず、その卓が
   * 「開催予定」ではなく「調整中」に見えてしまう（確定日に来られない人も
   * メンバーには残る、という #147 の前提そのもののケース）。
   *
   * そこで **開催が1件も分かっていない、自分がホストでない卓** に限って、
   * ロビー配下の開催一覧で補う。自分がホストの卓は横断一覧が全件返すので対象外。
   * 多くのユーザーで対象は0件になり、追加のリクエストは発生しない。
   */
  async function hydrateMissingSessions(
    lobbies: LobbyListItemModel[],
    sessions: GameSessionListItemModel[],
  ): Promise<GameSessionListItemModel[]> {
    const knownLobbyIds = new Set(sessions.map((s) => s.lobbyId));
    const targets = lobbies.filter(
      (l) => !knownLobbyIds.has(l.id) && l.hostUserId !== myUserId.value,
    );
    if (targets.length === 0) return sessions;

    const fetched = await Promise.all(
      targets.map((l) =>
        listLobbyGameSessions(l.id).catch(
          () => [] as GameSessionListItemModel[],
        ),
      ),
    );
    return [...sessions, ...fetched.flat()];
  }

  async function fetch() {
    loading.value = true;
    errorMessage.value = '';

    // 「自分の卓」と「さがす」は別の関心。公開一覧だけが落ちたときに
    // 取得できている自分の卓まで消えないよう、失敗を混ぜずに扱う
    const [mineResult, publicResult] = await Promise.allSettled([
      (async () => {
        const [mine, sessions] = await Promise.all([
          fetchMyLobbies(),
          fetchGameSessions(),
        ]);
        return { mine, sessions: await hydrateMissingSessions(mine, sessions) };
      })(),
      listPublicLobbies(),
    ]);

    if (mineResult.status === 'fulfilled') {
      myLobbies.value = mineResult.value.mine;
      gameSessions.value = mineResult.value.sessions;
    }
    if (publicResult.status === 'fulfilled') {
      fetchedPublicLobbies.value = publicResult.value;
    }

    if (mineResult.status === 'rejected') {
      errorMessage.value = '卓の一覧を取得できませんでした';
    } else if (publicResult.status === 'rejected') {
      errorMessage.value = '募集中の卓を取得できませんでした';
    }

    loading.value = false;
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
