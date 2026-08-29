import { ref, computed, onMounted, toValue } from 'vue';
import type { MaybeRefOrGetter } from 'vue';
import type { LobbyAvailabilityDate } from '@taku-biyori/shared';
import {
  LobbyAction,
  LobbyStatus,
  canPerformLobbyAction,
} from '@taku-biyori/shared';
import {
  listLobbyAvailabilityDates,
  updateLobbyAvailabilityDateResponse,
} from '@/api/lobby';
import type { Answer } from '@/features/Lobby/Detail/Schedule/types';

const CYCLE: Record<Answer, Answer> = {
  ok: 'maybe',
  maybe: 'ng',
  ng: 'ok',
};

export const useSchedule = (
  lobbyId: string,
  myMemberId: MaybeRefOrGetter<string | null>,
  status: MaybeRefOrGetter<LobbyStatus | undefined>,
) => {
  /** 取得済みの候補日一覧（回答を含む） */
  const availabilityDates = ref<LobbyAvailabilityDate[]>([]);
  /** 候補日の取得・送信中かどうか */
  const loading = ref(false);
  /** 直近の操作で発生したエラーメッセージ */
  const errorMessage = ref('');

  async function fetch() {
    loading.value = true;
    errorMessage.value = '';
    try {
      availabilityDates.value = await listLobbyAvailabilityDates(lobbyId);
    } catch {
      errorMessage.value = '候補日の取得に失敗しました';
    } finally {
      loading.value = false;
    }
  }

  onMounted(fetch);

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
  const draftAnswers = ref<Map<string, Answer>>(new Map());

  // 編集前の状態。差分比較の基準として使う
  const originalAnswers = computed<Map<string, Answer>>(() => {
    const map = new Map<string, Answer>();
    const memberId = toValue(myMemberId);
    if (!memberId) return map;
    for (const d of availabilityDates.value) {
      const a = d.answers.find((a) => a.memberId === memberId);
      if (a) map.set(d.id, a.answer);
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
  function currentAnswer(dateId: string): Answer | null {
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

  /** original と異なる差分のみ送信し、完了後に候補日を再取得して編集モードを終了する */
  async function submitEdit() {
    const changes = [...draftAnswers.value.entries()].filter(
      ([dateId, answer]) => originalAnswers.value.get(dateId) !== answer,
    );
    await Promise.all(
      changes.map(([dateId, answer]) =>
        updateLobbyAvailabilityDateResponse(lobbyId, dateId, { answer }),
      ),
    );
    await fetch();
    isEditing.value = false;
  }

  return {
    availabilityDates,
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
    // サーバを SSOT とし、ゲスト回答更新後などに候補日を再取得するために公開する
    refetch: fetch,
  };
};
