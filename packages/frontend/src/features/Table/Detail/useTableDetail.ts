import { computed, onMounted, ref } from 'vue';
import type { LobbyDetailModel, LobbyEntryModel } from '@/models/lobby';
import type { GameSessionListItemModel } from '@/models/game-session';
import { listLobbyGameSessions } from '@/api/game-session';
import { useGetLobbyDetail } from '@/features/Lobby/Detail/composables/useGetLobbyDetail';
import { resolveTableStatus } from '@/features/Table/resolveTableStatus';
import { TableCardStatus } from '@/features/Table/tableCardStatus';
import { TableRole } from '@/features/Table/Detail/tableRole';

/**
 * 卓詳細の土台。
 *
 * データ側は Lobby と GameSession のままなので、この画面はロビー詳細と
 * ロビー配下の開催一覧の**2本**を取り、代表になる開催を1つ選んで
 * 「卓」として見せる（#147 / #152）。開催の詳細（着席・プレイメモ）は
 * 代表が決まってから子コンポーネントが取りに行く。
 */
export const useTableDetail = (lobbyId: string) => {
  const {
    lobby,
    loading: loadingLobby,
    errorMessage,
    fetch: fetchLobby,
    patchLobby,
    addEntry,
    removeEntry,
    activeEntryCount,
  } = useGetLobbyDetail(lobbyId);

  const sessions = ref<GameSessionListItemModel[]>([]);
  const loadingSessions = ref(false);

  async function fetchSessions() {
    loadingSessions.value = true;
    try {
      sessions.value = await listLobbyGameSessions(lobbyId);
    } catch {
      // 開催が取れなくてもロビーとしては表示できる。状態は「開催なし」に倒れる
      sessions.value = [];
    } finally {
      loadingSessions.value = false;
    }
  }

  onMounted(fetchSessions);

  /** ロビーと開催をまとめて取り直す。日程の確定・中止など状態が動いたあとに呼ぶ */
  async function fetch() {
    await Promise.all([fetchLobby(), fetchSessions()]);
  }

  const resolved = computed(() =>
    lobby.value === null
      ? null
      : resolveTableStatus(lobby.value.status, sessions.value),
  );

  /** 卓の状態。一覧のカードと同じ規則で解決する */
  const status = computed<TableCardStatus | null>(
    () => resolved.value?.status ?? null,
  );

  /** 代表になる開催の id。まだ開催が無い卓では null */
  const gameSessionId = computed<string | null>(
    () => resolved.value?.session?.id ?? null,
  );

  const loading = computed(() => loadingLobby.value || loadingSessions.value);

  return {
    lobby,
    sessions,
    status,
    gameSessionId,
    loading,
    errorMessage,
    activeEntryCount,
    fetch,
    fetchSessions,
    patchLobby,
    addEntry,
    removeEntry,
  };
};

/**
 * 卓を見ている人の立場を決める。
 *
 * ホスト判定はロビーの `hostUserId`、参加者判定は在籍中の参加（`activeEntries`）。
 * 脱退した人と未ログインはどちらも `guest` に倒れる。
 */
export const resolveTableRole = (
  lobby: Pick<LobbyDetailModel, 'hostUserId' | 'activeEntries'> | null,
  myUserId: string | null,
): TableRole => {
  if (lobby === null || myUserId === null) return TableRole.guest;
  if (lobby.hostUserId === myUserId) return TableRole.host;
  const isMember = lobby.activeEntries.some(
    (entry: LobbyEntryModel) => entry.userId === myUserId,
  );
  return isMember ? TableRole.member : TableRole.guest;
};
