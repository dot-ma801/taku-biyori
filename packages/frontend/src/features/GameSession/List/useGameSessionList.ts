import { computed, onMounted, ref } from 'vue';
import type { GameSessionStatus } from '@taku-biyori/shared';
import type { GameSessionListItemModel } from '@/models/game-session';
import { listGameSessions } from '@/api/game-session';
import { useAuthStore } from '@/stores/auth';

interface UseGameSessionListOptions {
  statuses?: GameSessionStatus[];
  sortByScheduledAt?: boolean;
  /**
   * 他人の公開ロビーの開催を一覧に含めるか。
   * 「終了した開催」のような自分の履歴を見せるセクションでは false にする。
   */
  includePublic?: boolean;
}

/**
 * `scheduledAt`（`YYYY-MM-DD`）をローカルタイムの深夜0時として解釈する。
 *
 * `new Date('2026-08-01')` は UTC の深夜0時になるため、UTC より進んだ TZ では
 * 当日の開催が「過去」と判定されてしまう。日付の比較はローカル基準で揃える
 * （バックエンドの getGameSessionStatus の today 判定と同じ考え方）。
 */
const toLocalDate = (scheduledAt: string): Date => {
  const [year, month, day] = scheduledAt.slice(0, 10).split('-').map(Number);
  return new Date(year ?? 0, (month ?? 1) - 1, day ?? 1);
};

/** 今日の深夜0時（ローカル） */
const startOfToday = (): Date => {
  const d = new Date();
  d.setHours(0, 0, 0, 0);
  return d;
};

export const useGameSessionList = (options: UseGameSessionListOptions = {}) => {
  const { statuses, sortByScheduledAt = false, includePublic = true } = options;
  const authStore = useAuthStore();

  /** 全開催（API レスポンスを model にしたもの） */
  const allSessions = ref<GameSessionListItemModel[]>([]);

  /** 取得中かどうか */
  const loading = ref(false);

  /** エラーメッセージ */
  const errorMessage = ref('');

  /**
   * 自分に関係する開催か。
   *
   * v0.2 の `role`（'host' | 'member' | null）を置き換えた判定。
   * role は導出値でありながら「誰がホストか」を捨てていたため、
   * v2 は `hostUserId` と着席者の `userId` を返し、判定はクライアントで行う。
   */
  const isMine = (session: GameSessionListItemModel): boolean => {
    const myUserId = authStore.currentUser?.id;
    if (!myUserId) return false;
    return (
      session.hostUserId === myUserId || session.seatUserIds.includes(myUserId)
    );
  };

  const publicSessions = computed(() =>
    allSessions.value.filter((s) => !isMine(s)),
  );

  const mySessions = computed(() => allSessions.value.filter(isMine));

  /** 自分の開催のうち statuses に該当するもの（未指定時は mySessions をそのまま返す） */
  const filteredMySessions = computed(() => {
    let result =
      statuses !== undefined
        ? mySessions.value.filter((s) => statuses.includes(s.status))
        : mySessions.value;
    if (sortByScheduledAt) {
      // 開催は生まれた時点で日程が決まっているため scheduledAt は必ず入る（design-v2 §3-7）
      result = [...result].sort(
        (a, b) =>
          toLocalDate(a.scheduledAt).getTime() -
          toLocalDate(b.scheduledAt).getTime(),
      );
    }
    return result;
  });

  /** 公開ロビーの開催のうち statuses に該当するもの（未指定時は publicSessions をそのまま返す） */
  const filteredPublicSessions = computed(() => {
    if (!includePublic) return [];
    if (statuses === undefined) return publicSessions.value;
    return publicSessions.value.filter((s) => statuses.includes(s.status));
  });

  /**
   * 絞り込み後に表示するセッションが1件でもあるか。
   * セクションごと非表示にしたい呼び出し側（ダッシュボードの各セクション）が使う。
   */
  const hasFilteredSessions = computed(
    () =>
      filteredMySessions.value.length > 0 ||
      filteredPublicSessions.value.length > 0,
  );

  /**
   * 次の開催。
   * mySessions の中で scheduledAt が現在以降かつ最も近いもの。該当なければ null。
   */
  const nextSession = computed<GameSessionListItemModel | null>(() => {
    // scheduledAt は日付のみなので、当日の開催も「これから」として含める
    const today = startOfToday().getTime();
    const upcoming = mySessions.value.filter(
      (s) => toLocalDate(s.scheduledAt).getTime() >= today,
    );
    if (upcoming.length === 0) return null;
    return (
      upcoming.reduce((nearest, s) => {
        const nearestTime = toLocalDate(nearest.scheduledAt).getTime();
        const sTime = toLocalDate(s.scheduledAt).getTime();
        return sTime < nearestTime ? s : nearest;
      }) ?? null
    );
  });

  /** 開催の横断一覧を取得する */
  async function fetch() {
    loading.value = true;
    errorMessage.value = '';
    try {
      allSessions.value = await listGameSessions();
    } catch {
      errorMessage.value = '開催一覧の取得に失敗しました';
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
    hasFilteredSessions,
    nextSession,
    loading,
    errorMessage,
    fetch,
  };
};
