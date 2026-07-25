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

  /** 自分のセッションのうち statuses に該当するもの（未指定時は mySessions をそのまま返す） */
  const filteredMySessions = computed(() => {
    let result =
      statuses !== undefined
        ? mySessions.value.filter((s) => statuses.includes(s.status))
        : mySessions.value;
    if (sortByScheduledAt) {
      // 卓は日程が確定した状態でのみ存在するため scheduledAt は必ず入る（design-v1.1 §8）
      result = [...result].sort(
        (a, b) =>
          new Date(a.scheduledAt).getTime() - new Date(b.scheduledAt).getTime(),
      );
    }
    return result;
  });

  /** 公開セッションのうち statuses に該当するもの（未指定時は publicSessions をそのまま返す） */
  const filteredPublicSessions = computed(() => {
    if (statuses === undefined) return publicSessions.value;
    return publicSessions.value.filter((s) => statuses.includes(s.status));
  });

  /**
   * 次の卓。
   * mySessions の中で scheduledAt が現在以降かつ最も近いセッション。
   * 該当なければ null。
   */
  const nextSession = computed<GameSessionListItem | null>(() => {
    const now = Date.now();
    const upcoming = mySessions.value.filter(
      (s) => new Date(s.scheduledAt).getTime() >= now,
    );
    if (upcoming.length === 0) return null;
    return (
      upcoming.reduce((nearest, s) => {
        const nearestTime = new Date(nearest.scheduledAt).getTime();
        const sTime = new Date(s.scheduledAt).getTime();
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
    filteredMySessions,
    filteredPublicSessions,
    nextSession,
    loading,
    errorMessage,
    fetch,
  };
};
