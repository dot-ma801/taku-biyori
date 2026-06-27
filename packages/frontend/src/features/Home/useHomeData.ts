import { computed, onMounted, ref } from 'vue';
import type { GameSessionListItem } from '@taku-biyori/shared';
import { GameSessionStatus } from '@taku-biyori/shared';
import { listGameSessions } from '@/api/game-session';

export const useHomeData = () => {
  /** 全セッション（APIレスポンスそのまま） */
  const allSessions = ref<GameSessionListItem[]>([]);

  /** 取得中かどうか */
  const loading = ref(false);

  /** エラーメッセージ */
  const errorMessage = ref('');

  /**
   * 募集中の公開セッション。
   * isPublished=true かつ status=open のセッションが対象。
   */
  const publicSessions = computed(() =>
    allSessions.value.filter(
      (s) => s.isPublished && s.status === GameSessionStatus.open,
    ),
  );

  /**
   * 自分が関わるセッション。
   * 非公開、または open 以外のステータスのセッションが対象。
   */
  const mySessions = computed(() =>
    allSessions.value.filter(
      (s) => !s.isPublished || s.status !== GameSessionStatus.open,
    ),
  );

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
    nextSession,
    loading,
    errorMessage,
    fetch,
  };
};
