import { ref, computed, onMounted } from 'vue';
import type { Ref } from 'vue';
import type { AvailabilityDate } from '@taku-biyori/shared';
import { listAvailabilityDates, updateAvailabilityDateResponse } from '@/api/game-session';
import type { Answer } from '@/features/GameSession/Detail/Schedule/types';

const CYCLE: Record<Answer, Answer> = {
  ok: 'maybe',
  maybe: 'ng',
  ng: 'ok',
};

export const useSchedule = (
  gameSessionId: string,
  myMemberId: Ref<string | null>,
) => {
  const availabilityDates = ref<AvailabilityDate[]>([]);
  const loading = ref(false);
  const errorMessage = ref('');

  async function fetch() {
    loading.value = true;
    errorMessage.value = '';
    try {
      availabilityDates.value = await listAvailabilityDates(gameSessionId);
    } catch {
      errorMessage.value = '候補日の取得に失敗しました';
    } finally {
      loading.value = false;
    }
  }

  onMounted(fetch);

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
    await fetch();
    isEditing.value = false;
  }

  return {
    availabilityDates,
    loading,
    errorMessage,
    isEditing,
    draftAnswers,
    hasChanges,
    enterEditMode,
    cycleAnswer,
    submitEdit,
  };
};
