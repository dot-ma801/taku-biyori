import { computed, onMounted, ref } from 'vue';
import type { LobbyDetailModel, LobbyEntryModel } from '@/models/lobby';
import type { GameSessionListItemModel } from '@/models/game-session';
import { listLobbyGameSessions } from '@/api/game-session';
import { useGetLobbyDetail } from '@/features/Lobby/Detail/composables/useGetLobbyDetail';
import { resolveGameSessionCardStatus } from '@/features/GameSession/resolveGameSessionCardStatus';
import { GameSessionCardStatus } from '@/features/GameSession/gameSessionCardStatus';
import { GameSessionRole } from '@/features/GameSession/Detail/gameSessionRole';

/**
 * 卓詳細の土台。
 *
 * データ側は Lobby と GameSession のままなので、この画面はロビー詳細と
 * ロビー配下の開催一覧の**2本**を取り、代表になる開催を1つ選んで
 * 「卓」として見せる（#147 / #152）。開催の詳細（着席・プレイメモ）は
 * 代表が決まってから子コンポーネントが取りに行く。
 */
export const useGameSessionDetailPage = (lobbyId: string) => {
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
      : resolveGameSessionCardStatus(lobby.value.status, sessions.value),
  );

  /** 卓の状態。一覧のカードと同じ規則で解決する */
  const status = computed<GameSessionCardStatus | null>(
    () => resolved.value?.status ?? null,
  );

  /** 代表になる開催の id。まだ開催が無い卓では null */
  const gameSessionId = computed<string | null>(
    () => resolved.value?.session?.id ?? null,
  );

  const loading = computed(() => loadingLobby.value || loadingSessions.value);

  /** 日程調整の履歴。新しい順・先頭が最新（LobbyDetailModel の並びをそのまま） */
  const schedulePolls = computed(() => lobby.value?.schedulePolls ?? []);

  /**
   * まだ確定していない日程調整があるか。
   *
   * **見せている開催ではなく、ロビー配下の開催すべてと突き合わせる。**
   * 表示中の開催と比べると、開催が2件以上あるロビーでホストが古いほうの URL を
   * 開いたときに「確定待ち」と誤判定し、確定済みの調整からもう1件作れてしまう。
   *
   * 最新の調整より後に作られた開催が1件でもあれば、その調整は決着済みとみなす。
   */
  const hasPendingSchedulePoll = computed(() => {
    const latestPoll = schedulePolls.value[0];
    if (!latestPoll) return false;
    return !sessions.value.some(
      (session) => session.createdAt.getTime() > latestPoll.createdAt.getTime(),
    );
  });

  return {
    lobby,
    schedulePolls,
    hasPendingSchedulePoll,
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
export const resolveGameSessionRole = (
  lobby: Pick<LobbyDetailModel, 'hostUserId' | 'activeEntries'> | null,
  myUserId: string | null,
): GameSessionRole => {
  if (lobby === null || myUserId === null) return GameSessionRole.guest;
  if (lobby.hostUserId === myUserId) return GameSessionRole.host;
  const isMember = lobby.activeEntries.some(
    (entry: LobbyEntryModel) => entry.userId === myUserId,
  );
  return isMember ? GameSessionRole.member : GameSessionRole.guest;
};
