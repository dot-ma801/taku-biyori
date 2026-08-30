import { ref } from 'vue';
import { getSchedulePoll } from '@/api/lobby';
import type {
  CandidateDateModel,
  SchedulePollModel,
} from '@/models/schedule-poll';

/**
 * 過去の日程調整（SchedulePoll）の遅延取得とキャッシュを担う composable。
 *
 * `SchedulePollHistory.vue` の各 `BaseCollapsible` が開かれたときだけ `ensureLoaded` を呼ぶ
 * （開くまで通信しない＝遅延取得）。一度取得した poll は `cache` に残るので、
 * 閉じて再度開いても再取得しない。
 */
export const useSchedulePollHistory = (lobbyId: string) => {
  /** pollId → 取得済みの調整 */
  const cache = ref(new Map<string, SchedulePollModel>());
  /** 取得中の pollId 一覧 */
  const loadingIds = ref(new Set<string>());
  /** pollId → 取得エラーメッセージ */
  const errorMessages = ref(new Map<string, string>());

  /**
   * 指定 pollId の調整を取得する。すでにキャッシュ済み・取得中なら何もしない。
   * キャッシュ判定と取得中フラグの設定は最初の await より前（同期的）に行うため、
   * 同時に複数回呼ばれても実際の取得は1回だけになる。
   */
  async function ensureLoaded(pollId: string) {
    if (cache.value.has(pollId) || loadingIds.value.has(pollId)) {
      return;
    }
    loadingIds.value = new Set(loadingIds.value).add(pollId);
    try {
      const poll = await getSchedulePoll(lobbyId, pollId);
      cache.value = new Map(cache.value).set(pollId, poll);
      const nextErrors = new Map(errorMessages.value);
      nextErrors.delete(pollId);
      errorMessages.value = nextErrors;
    } catch {
      errorMessages.value = new Map(errorMessages.value).set(
        pollId,
        '日程調整の取得に失敗しました',
      );
    } finally {
      const nextLoading = new Set(loadingIds.value);
      nextLoading.delete(pollId);
      loadingIds.value = nextLoading;
    }
  }

  /** 指定 pollId の候補日一覧。未取得なら空配列 */
  function candidateDatesOf(pollId: string): CandidateDateModel[] {
    return cache.value.get(pollId)?.candidateDates ?? [];
  }

  /** 指定 pollId が取得中かどうか */
  function isLoading(pollId: string): boolean {
    return loadingIds.value.has(pollId);
  }

  /** 指定 pollId の取得エラーメッセージ。無ければ空文字 */
  function errorMessageOf(pollId: string): string {
    return errorMessages.value.get(pollId) ?? '';
  }

  return { ensureLoaded, candidateDatesOf, isLoading, errorMessageOf };
};
