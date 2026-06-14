import { ref, computed } from 'vue';
import type { Ref } from 'vue';
import type { AvailabilityDate } from '@taku-biyori/shared';
import { updateAvailabilityDateResponse } from '@/api/game-session';
import type { Answer } from '@/features/GameSession/Detail/Schedule/types';

const CYCLE: Record<Answer, Answer> = {
  ok: 'maybe',
  maybe: 'ng',
  ng: 'ok',
};

export const useScheduleEdit = (
  availabilityDates: Ref<AvailabilityDate[]>,
  myMemberId: Ref<string | null>,
  gameSessionId: string,
  onSubmitted: () => Promise<void>,
) => {
  const isEditing = ref(false);
  const draftAnswers = ref<Map<string, Answer>>(new Map());

  // 編集前の状態。差分比較の基準として使う
  const originalAnswers = computed<Map<string, Answer>>(() => {
    const map = new Map<string, Answer>();
    if (!myMemberId.value) return map;
    for (const d of availabilityDates.value) {
      const a = d.answers.find((a) => a.memberId === myMemberId.value);
      if (a) map.set(d.id, a.answer);
    }
    return map;
  });

  const hasChanges = computed(() => {
    for (const [dateId, answer] of draftAnswers.value) {
      if (originalAnswers.value.get(dateId) !== answer) return true;
    }
    return false;
  });

  function enterEditMode() {
    draftAnswers.value = new Map(originalAnswers.value);
    isEditing.value = true;
  }

  // 現在の回答（draftを優先、なければoriginal）を返す
  function currentAnswer(dateId: string): Answer | null {
    return (
      draftAnswers.value.get(dateId) ??
      originalAnswers.value.get(dateId) ??
      null
    );
  }

  function cycleAnswer(dateId: string) {
    const cur = currentAnswer(dateId);
    draftAnswers.value.set(dateId, cur ? CYCLE[cur] : 'ok');
  }

  async function submitEdit() {
    const changes = [...draftAnswers.value.entries()].filter(
      ([dateId, answer]) => originalAnswers.value.get(dateId) !== answer,
    );
    await Promise.all(
      changes.map(([dateId, answer]) =>
        updateAvailabilityDateResponse(gameSessionId, dateId, { answer }),
      ),
    );
    await onSubmitted();
    isEditing.value = false;
  }

  return {
    isEditing,
    draftAnswers,
    hasChanges,
    enterEditMode,
    cycleAnswer,
    submitEdit,
  };
};
