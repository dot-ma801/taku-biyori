import { computed, ref, toValue } from 'vue';
import type { MaybeRefOrGetter } from 'vue';
import type { AvailabilityDate } from '@taku-biyori/shared';
import { GameSessionStatus } from '@taku-biyori/shared';
import { updateGuestAvailabilityDateResponse } from '@/api/game-session';
import { useToast } from '@/composables/useToast';
import type { Answer } from '@/features/GameSession/Detail/Schedule/types';

const CYCLE: Record<Answer, Answer> = {
  ok: 'maybe',
  maybe: 'ng',
  ng: 'ok',
};

/** 編集ドラフト1件。どのゲスト列・どの候補日を何に変えるかを保持する */
interface DraftAnswer {
  memberId: string;
  dateId: string;
  answer: Answer;
}

/**
 * ゲスト（完全匿名・本人確認なし）が全ゲスト列の日程回答を編集するための composable。
 * 調整さん方式で、memberId を指定して任意のゲスト列を更新できる。
 * サーバ値（availabilityDates）は親が所有し getter で受け取る。書き込みは onUpdated で親へ委譲する。
 */
export const useGuestSchedule = (
  gameSessionId: string,
  // NOTE: token は招待リンク（?token=）由来。読み取りは getter で受ける。
  token: MaybeRefOrGetter<string | null>,
  availabilityDates: MaybeRefOrGetter<AvailabilityDate[]>,
  status: MaybeRefOrGetter<GameSessionStatus | undefined>,
  onUpdated: (date: AvailabilityDate) => void,
) => {
  const toast = useToast();
  const loading = ref(false);
  const isEditing = ref(false);

  /**
   * 編集ドラフト（`${memberId}::${dateId}` → 回答）。
   * サーバ値とは分離して保持し、変更検知・キャンセルを成立させる。
   * この ref はこの composable が所有する。
   */
  const draftAnswers = ref<Map<string, DraftAnswer>>(new Map());

  function keyOf(memberId: string, dateId: string): string {
    return `${memberId}::${dateId}`;
  }

  /** 招待トークンが付与されているか */
  const hasToken = computed(() => !!toValue(token));

  /** ゲストが日程回答を編集できるか。トークンがあり status が open / scheduling のときのみ true */
  const canEditGuestSchedule = computed(() => {
    const s = toValue(status);
    return (
      hasToken.value &&
      (s === GameSessionStatus.open || s === GameSessionStatus.scheduling)
    );
  });

  /** サーバ値における指定ゲスト列・候補日の回答（なければ null） */
  function originalAnswerOf(memberId: string, dateId: string): Answer | null {
    const date = toValue(availabilityDates).find((d) => d.id === dateId);
    const found = date?.answers.find((a) => a.memberId === memberId);
    return found?.answer ?? null;
  }

  /** 現在の回答（ドラフトを優先し、なければサーバ値） */
  function currentAnswerOf(memberId: string, dateId: string): Answer | null {
    return (
      draftAnswers.value.get(keyOf(memberId, dateId))?.answer ??
      originalAnswerOf(memberId, dateId)
    );
  }

  /** いずれかのドラフトがサーバ値と異なるか */
  const hasChanges = computed(() => {
    for (const { memberId, dateId, answer } of draftAnswers.value.values()) {
      if (originalAnswerOf(memberId, dateId) !== answer) return true;
    }
    return false;
  });

  /** 編集モードを開始する。ドラフトは空から始め、操作したセルだけ記録する */
  function enterEditMode() {
    draftAnswers.value = new Map();
    isEditing.value = true;
  }

  /** 編集をキャンセルしてドラフトを破棄する */
  function cancelEdit() {
    draftAnswers.value = new Map();
    isEditing.value = false;
  }

  /** 指定セルの回答を ok → maybe → ng → ok の順に循環させる（未回答は ok から） */
  function cycleAnswer(memberId: string, dateId: string) {
    const cur = currentAnswerOf(memberId, dateId);
    draftAnswers.value.set(keyOf(memberId, dateId), {
      memberId,
      dateId,
      answer: cur ? CYCLE[cur] : 'ok',
    });
  }

  /**
   * サーバ値と異なるドラフトをまとめて送信する。
   * 各成功ごとに onUpdated で更新後の候補日を親へ渡す。
   * トークン未設定・変更なし・loading 中の呼び出しは無視する。
   */
  async function submitEdit() {
    if (loading.value) return;
    const currentToken = toValue(token);
    if (!currentToken) return;

    const changes = [...draftAnswers.value.values()].filter(
      ({ memberId, dateId, answer }) =>
        originalAnswerOf(memberId, dateId) !== answer,
    );
    if (changes.length === 0) {
      isEditing.value = false;
      return;
    }

    loading.value = true;
    try {
      for (const { memberId, dateId, answer } of changes) {
        const updated = await updateGuestAvailabilityDateResponse(
          gameSessionId,
          dateId,
          currentToken,
          { memberId, answer },
        );
        onUpdated(updated);
      }
      draftAnswers.value = new Map();
      isEditing.value = false;
    } catch {
      toast.error('日程回答の更新に失敗しました');
    } finally {
      loading.value = false;
    }
  }

  return {
    loading,
    isEditing,
    hasToken,
    canEditGuestSchedule,
    hasChanges,
    currentAnswerOf,
    cycleAnswer,
    enterEditMode,
    cancelEdit,
    submitEdit,
  };
};
