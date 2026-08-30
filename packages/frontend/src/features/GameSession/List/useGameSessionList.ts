import { computed, onMounted, ref } from 'vue';
import type { LegacyGameSessionListItem } from '@taku-biyori/shared';
import type { GameSessionStatus } from '@taku-biyori/shared';
import { listGameSessions } from '@/api/game-session';

interface UseGameSessionListOptions {
  statuses?: GameSessionStatus[];
  sortByScheduledAt?: boolean;
  /**
   * 他人の公開セッションを一覧に含めるか。
   * 「終了した卓」のような自分の履歴を見せるセクションでは false にする。
   */
  includePublic?: boolean;
}

/**
 * `scheduledAt`（`YYYY-MM-DD`）をローカルタイムの深夜0時として解釈する。
 *
 * `new Date('2026-08-01')` は UTC の深夜0時になるため、UTC より進んだ TZ では
 * 当日の卓が「過去」と判定されてしまう。日付の比較はローカル基準で揃える
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
  /** 全セッション（APIレスポンスそのまま） */
  const allSessions = ref<LegacyGameSessionListItem[]>([]);

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
          toLocalDate(a.scheduledAt).getTime() -
          toLocalDate(b.scheduledAt).getTime(),
      );
    }
    return result;
  });

  /** 公開セッションのうち statuses に該当するもの（未指定時は publicSessions をそのまま返す） */
  const filteredPublicSessions = computed(() => {
    if (!includePublic) return [];
    if (statuses === undefined) return publicSessions.value;
    return publicSessions.value.filter((s) => statuses.includes(s.status));
  });

  /**
   * 絞り込み後に表示するセッションが1件でもあるか。
   * セクションごと非表示にしたい呼び出し側（ダッシュボードの「非公開の卓」など）が使う。
   */
  const hasFilteredSessions = computed(
    () =>
      filteredMySessions.value.length > 0 ||
      filteredPublicSessions.value.length > 0,
  );

  /**
   * 次の卓。
   * mySessions の中で scheduledAt が現在以降かつ最も近いセッション。
   * 該当なければ null。
   */
  const nextSession = computed<LegacyGameSessionListItem | null>(() => {
    // scheduledAt は日付のみなので、当日の卓も「これから開催される卓」として含める
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
    hasFilteredSessions,
    nextSession,
    loading,
    errorMessage,
    fetch,
  };
};
