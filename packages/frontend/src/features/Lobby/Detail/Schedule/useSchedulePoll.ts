import { computed, ref, toValue, watch } from 'vue';
import type { MaybeRefOrGetter } from 'vue';
import {
  LobbyAction,
  LobbyStatus,
  canPerformLobbyAction,
} from '@taku-biyori/shared';
import { getSchedulePoll, upsertScheduleAnswers } from '@/api/lobby';
import { ApiError } from '@/lib/api-client';
import type {
  CandidateDateModel,
  ScheduleAnswerValue,
  SchedulePollModel,
} from '@/models/schedule-poll';

const CYCLE: Record<ScheduleAnswerValue, ScheduleAnswerValue> = {
  ok: 'maybe',
  maybe: 'ng',
  ng: 'ok',
};

const STALE_POLL_MESSAGE =
  '新しい日程調整が始まっています。最新の状態を読み込み直してください';

/**
 * ログインユーザー（メンバー）が最新の日程調整（SchedulePoll）を閲覧・回答するための composable。
 *
 * サーバ値（poll）はこの composable が所有する。読み取り専用の依存（latestPollId /
 * myEntryId / status）は getter で受け、書き込みが必要なとき（調整が最新でなくなった
 * ＝ 409）は `onStale` コールバックで所有者（親）へ委譲する。
 */
export const useSchedulePoll = (
  lobbyId: string,
  // ロビー詳細（親）が持つ schedulePolls[0]?.id ?? null。親の取得が終わるまでは null。
  latestPollId: MaybeRefOrGetter<string | null>,
  // ログインユーザーの entryId（旧 myMemberId）。
  myEntryId: MaybeRefOrGetter<string | null>,
  status: MaybeRefOrGetter<LobbyStatus | undefined>,
  // 送信時に 409（この調整が最新でなくなった）を受けたとき、親にロビー詳細の
  // 再取得を依頼するコールバック。schedulePolls も古いため、この composable
  // 自身は再取得しない（親が持つ latestPollId 自体が古いため）。
  onStale: () => void,
) => {
  /** 取得済みの日程調整（候補日・回答を含む） */
  const poll = ref<SchedulePollModel | null>(null);
  /** 取得・送信中かどうか */
  const loading = ref(false);
  /** 直近の操作で発生したエラーメッセージ */
  const errorMessage = ref('');

  async function fetchPoll(pollId: string) {
    loading.value = true;
    errorMessage.value = '';
    try {
      poll.value = await getSchedulePoll(lobbyId, pollId);
    } catch {
      errorMessage.value = '日程調整の取得に失敗しました';
    } finally {
      loading.value = false;
    }
  }

  // onMounted ではなく watch で latestPollId の到着を待つ。調整が0件のロビーも
  // あるため、null は「まだ親の取得が終わっていない」と「調整が無い」の両方を
  // 表すが、どちらも取得しない点では同じなので区別しない。
  watch(
    () => toValue(latestPollId),
    (pollId) => {
      if (!pollId) return;
      void fetchPoll(pollId);
    },
    { immediate: true },
  );

  /** 現在の latestPollId で再取得する。latestPollId が null のときは何もしない */
  async function refetch() {
    const pollId = toValue(latestPollId);
    if (!pollId) return;
    await fetchPoll(pollId);
  }

  /** 候補日一覧。poll 未取得なら空配列 */
  const candidateDates = computed<CandidateDateModel[]>(
    () => poll.value?.candidateDates ?? [],
  );

  /**
   * 日程回答の入力が可能かどうか。公開済み（open / closed）のときのみ true。
   * 受付を閉じていても、すでに参加している人は回答できる（design-v2 §3-2）。
   */
  const canInputSchedule = computed(() => {
    const s = toValue(status);
    return (
      s !== undefined &&
      canPerformLobbyAction(LobbyAction.answerSchedule, s, 'member')
    );
  });

  /** 編集モード中かどうか */
  const isEditing = ref(false);
  /** 編集中のドラフト回答（候補日 id → 回答） */
  const draftAnswers = ref<Map<string, ScheduleAnswerValue>>(new Map());

  // 編集前の状態。差分比較の基準として使う。
  // 回答は candidateDates の answersByEntryId（Map）から引く。find は書かない。
  const originalAnswers = computed<Map<string, ScheduleAnswerValue>>(() => {
    const map = new Map<string, ScheduleAnswerValue>();
    const entryId = toValue(myEntryId);
    if (!entryId) return map;
    for (const date of candidateDates.value) {
      const answer = date.answersByEntryId.get(entryId);
      if (answer) map.set(date.id, answer.answer);
    }
    return map;
  });

  /** ドラフトが original から変更されているかどうか */
  const hasChanges = computed(() => {
    for (const [dateId, answer] of draftAnswers.value) {
      if (originalAnswers.value.get(dateId) !== answer) return true;
    }
    return false;
  });

  /** 編集モードを開始する。original をコピーしてドラフトを初期化する */
  function enterEditMode() {
    draftAnswers.value = new Map(originalAnswers.value);
    isEditing.value = true;
  }

  /** 編集をキャンセルしてドラフトを破棄する */
  function cancelEdit() {
    draftAnswers.value = new Map();
    isEditing.value = false;
  }

  // 現在の回答（draftを優先、なければoriginal）を返す
  function currentAnswer(dateId: string): ScheduleAnswerValue | null {
    return (
      draftAnswers.value.get(dateId) ??
      originalAnswers.value.get(dateId) ??
      null
    );
  }

  /** 指定候補日の回答を ok → maybe → ng → ok の順に循環させる（未回答は ok から） */
  function cycleAnswer(dateId: string) {
    const cur = currentAnswer(dateId);
    draftAnswers.value.set(dateId, cur ? CYCLE[cur] : 'ok');
  }

  /**
   * original と異なる差分のみを1リクエストにまとめて送信する
   * （候補日ごとの逐次送信ではなく、差分一括更新の API を1回呼ぶ）。
   *
   * 409（誰かが新しい調整を始め、この調整が最新でなくなった）を受けたときは
   * errorMessage を設定し `onStale` を呼ぶだけで、自分では再取得しない
   * （親が持つロビー詳細の schedulePolls も古いため、親に再取得させる必要がある）。
   */
  async function submitEdit() {
    const pollId = toValue(latestPollId);
    if (!pollId) return;

    const changes = [...draftAnswers.value.entries()].filter(
      ([dateId, answer]) => originalAnswers.value.get(dateId) !== answer,
    );

    if (changes.length === 0) {
      isEditing.value = false;
      return;
    }

    errorMessage.value = '';
    try {
      await upsertScheduleAnswers(lobbyId, pollId, {
        answers: changes.map(([candidateDateId, answer]) => ({
          candidateDateId,
          answer,
        })),
      });
      await fetchPoll(pollId);
      isEditing.value = false;
    } catch (err) {
      if (err instanceof ApiError && err.status === 409) {
        errorMessage.value = STALE_POLL_MESSAGE;
        draftAnswers.value = new Map();
        isEditing.value = false;
        onStale();
        return;
      }
      errorMessage.value = '日程回答の更新に失敗しました';
    }
  }

  return {
    poll,
    candidateDates,
    loading,
    errorMessage,
    canInputSchedule,
    isEditing,
    draftAnswers,
    hasChanges,
    enterEditMode,
    cancelEdit,
    cycleAnswer,
    submitEdit,
    refetch,
  };
};
