import { computed, getCurrentInstance, onMounted, onUnmounted, ref } from 'vue';
import type { LobbyStatus } from '@taku-biyori/shared';
import { listMyLobbies, listPublicLobbies } from '@/api/lobby';
import { ApiError } from '@/lib/api-client';
import type { LobbyListItemModel } from '@/models/lobby';
import { useSession } from '@/lib/auth';

export type UseLobbyListOptions = {
  /** 自分のロビーを取得しない（「探す」だけが要る呼び出し用） */
  skipMine?: boolean;
  /** 公開ロビーを取得しない（「自分のもの」だけが要る呼び出し用） */
  skipPublic?: boolean;
};

export const useLobbyList = (
  statuses?: LobbyStatus[],
  options: UseLobbyListOptions = {},
) => {
  /** 自分のロビー（ホスト or 在籍中の参加者） */
  const myLobbies = ref<LobbyListItemModel[]>([]);

  /** 公開かつ受付中のロビー（サーバから取得したまま。自分の分も含む） */
  const fetchedPublicLobbies = ref<LobbyListItemModel[]>([]);

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
   * `GET /api/lobbies` は自分が関わるロビーも公開されていれば返すため、
   * 「探す」側の一覧から自分の分を取り除くのに使う。
   */
  const isMine = (lobby: LobbyListItemModel): boolean => {
    const userId = myUserId.value;
    if (userId === null) return false;
    return (
      lobby.hostUserId === userId ||
      lobby.activeEntries.some((entry) => entry.userId === userId)
    );
  };

  /**
   * 「探す」側に出すロビー。**取得時ではなく computed で絞る。**
   * ダッシュボードはセッション復元を待たずに描画されるため、fetch の時点では
   * まだ userId が null のことがある。取得時に絞ると、そのとき自分のロビーが
   * 「募集中のロビー」に混ざったまま、後からセッションが届いても消えない。
   */
  const publicLobbies = computed(() =>
    fetchedPublicLobbies.value.filter((l) => !isMine(l)),
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
   * 絞り込み後に表示するロビーが1件でもあるか。
   * セクションごと非表示にしたい呼び出し側（ダッシュボードの「下書きのロビー」など）が使う。
   */
  const hasFilteredLobbies = computed(
    () =>
      filteredMyLobbies.value.length > 0 ||
      filteredPublicLobbies.value.length > 0,
  );

  /**
   * 自分のロビーを取る。未ログインなら 401 になるが、公開ロビーの一覧は
   * ログイン不要で見せたいのでエラーにせず空で扱う。
   */
  async function fetchMine(): Promise<LobbyListItemModel[]> {
    if (options.skipMine) return [];
    try {
      return await listMyLobbies();
    } catch (e) {
      if (e instanceof ApiError && e.status === 401) return [];
      throw e;
    }
  }

  async function fetchPublic(): Promise<LobbyListItemModel[]> {
    if (options.skipPublic) return [];
    return listPublicLobbies();
  }

  /** ロビー一覧を取得する（自分の分と公開の分を並行で取る） */
  async function fetch() {
    loading.value = true;
    errorMessage.value = '';
    try {
      const [mine, publics] = await Promise.all([fetchMine(), fetchPublic()]);
      myLobbies.value = mine;
      fetchedPublicLobbies.value = publics;
    } catch {
      errorMessage.value = 'ロビー一覧の取得に失敗しました';
    } finally {
      loading.value = false;
    }
  }

  onMounted(fetch);

  return {
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
