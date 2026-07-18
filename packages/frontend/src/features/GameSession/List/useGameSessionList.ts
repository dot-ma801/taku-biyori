import { computed, onMounted, ref } from 'vue';
import type { GameSessionListItem } from '@taku-biyori/shared';
import type { GameSessionStatus } from '@taku-biyori/shared';
import { listGameSessions } from '@/api/game-session';

interface UseGameSessionListOptions {
  statuses?: GameSessionStatus[];
  sortByScheduledAt?: boolean;
}

export const useGameSessionList = (options: UseGameSessionListOptions = {}) => {
  const { statuses, sortByScheduledAt = false } = options;
  /** 全セッション（APIレスポンスそのまま） */
  const allSessions = ref<GameSessionListItem[]>([]);

  /** 取得中かどうか */
  const loading = ref(false);

  /** エラーメッセージ */
  const errorMessage = ref('');

  const publicSessions = computed(() =>
    allSessions.value.filter((s) => s.role === null),
  );

  const mySessions = computed(() =>
    allSessions.value.filter((s) => s.role !== null),
  );

  const filteredSessions = computed(() => {
    let result = statuses !== undefined
      ? allSessions.value.filter((s) => statuses.includes(s.status))
      : allSessions.value;
    if (sortByScheduledAt) {
      result = [...result].sort((a, b) => {
        if (a.scheduledAt == null && b.scheduledAt == null) return 0;
        if (a.scheduledAt == null) return 1;
        if (b.scheduledAt == null) return -1;
        return new Date(a.scheduledAt).getTime() - new Date(b.scheduledAt).getTime();
      });
    }
    return result;
  });

  /**
   * 次の卓。
   * mySessions の中で scheduledAt が現在以降かつ最も近いセッション。
   * 該当なければ null。
   */
  const nextSession = computed<GameSessionListItem | null>(() => {
    const now = Date.now();
    const upcoming = mySessions.value.filter(
      (s) => s.scheduledAt != null && new Date(s.scheduledAt).getTime() >= now,
    );
    if (upcoming.length === 0) return null;
    return (
      upcoming.reduce((nearest, s) => {
        const nearestTime = new Date(nearest.scheduledAt!).getTime();
        const sTime = new Date(s.scheduledAt!).getTime();
        return sTime < nearestTime ? s : nearest;
      }) ?? null
    );
  });

  /** セッション一覧を取得する */
  async function fetch() {
    loading.value = true;
    errorMessage.value = '';
    try {
      allSessions.value = await listGameSessions();
    } catch {
      errorMessage.value = 'セッション一覧の取得に失敗しました';
    } finally {
      loading.value = false;
    }
  }

  onMounted(fetch);

  return {
    allSessions,
    publicSessions,
    mySessions,
    filteredSessions,
    nextSession,
    loading,
    errorMessage,
    fetch,
  };
};
