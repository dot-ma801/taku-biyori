import { computed, ref, toValue } from 'vue';
import type { MaybeRefOrGetter } from 'vue';
import { useRouter } from 'vue-router';
import type { LobbyAvailabilityDate, LobbyMember } from '@taku-biyori/shared';
import { confirmLobby } from '@/api/lobby';
import { ApiError } from '@/lib/api-client';
import { useToast } from '@/composables/useToast';
import { useScheduleView } from '@/features/Lobby/Detail/Schedule/useScheduleView';

export const useConfirmFlow = (
  lobbyId: string,
  members: MaybeRefOrGetter<LobbyMember[]>,
  availabilityDates: MaybeRefOrGetter<LobbyAvailabilityDate[]>,
  maxPlayers: MaybeRefOrGetter<number | null | undefined>,
  onConflict: () => void,
  // NOTE: 表（ラジオボタン）側の選択を初期選択として取り込む。ダイアログを開くたびに reset() から参照する。
  initialCandidateId: MaybeRefOrGetter<string | null> = () => null,
) => {
  const router = useRouter();
  const toast = useToast();
  const { answerCounts, getAnswer } = useScheduleView(
    () => [],
    () => new Map(),
  );

  const step = ref<1 | 2 | 3>(1);
  const selectedCandidateId = ref<string | null>(null);
  const selectedMemberIds = ref<Set<string>>(new Set());
  const loading = ref(false);

  const candidateOptions = computed(() =>
    toValue(availabilityDates).map((d) => ({
      id: d.id,
      date: d.date,
      counts: answerCounts(d, toValue(members)),
    })),
  );

  function defaultMemberIds(candidateId: string): Set<string> {
    const date = toValue(availabilityDates).find((d) => d.id === candidateId);
    if (!date) return new Set();
    return new Set(
      toValue(members)
        .filter((m) => {
          const answer = getAnswer(date, m.id);
          return answer === 'ok' || answer === 'maybe';
        })
        .map((m) => m.id),
    );
  }

  function isWarnedMember(memberId: string): boolean {
    if (!selectedCandidateId.value) return false;
    const date = toValue(availabilityDates).find(
      (d) => d.id === selectedCandidateId.value,
    );
    if (!date) return false;
    const answer = getAnswer(date, memberId);
    return answer === 'ng' || answer === null;
  }

  function selectCandidate(id: string) {
    selectedCandidateId.value = id;
    selectedMemberIds.value = defaultMemberIds(id);
  }

  function toggleMember(id: string) {
    const next = new Set(selectedMemberIds.value);
    if (next.has(id)) {
      next.delete(id);
    } else {
      next.add(id);
    }
    selectedMemberIds.value = next;
  }

  const selectedCount = computed(() => selectedMemberIds.value.size);
  const canProceedCandidate = computed(
    () => selectedCandidateId.value !== null,
  );
  const canProceedMembers = computed(() => selectedCount.value >= 1);
  const capacityMismatch = computed(() => {
    const max = toValue(maxPlayers);
    return max != null && selectedCount.value !== max;
  });

  function goNext() {
    if (step.value < 3) step.value = (step.value + 1) as 2 | 3;
  }

  function goBack() {
    if (step.value > 1) step.value = (step.value - 1) as 1 | 2;
  }

  function reset() {
    step.value = 1;
    const initialId = toValue(initialCandidateId);
    if (initialId) {
      selectCandidate(initialId);
    } else {
      selectedCandidateId.value = null;
      selectedMemberIds.value = new Set();
    }
  }

  async function confirm() {
    if (
      loading.value ||
      !selectedCandidateId.value ||
      selectedCount.value === 0
    )
      return;
    loading.value = true;
    try {
      const created = await confirmLobby(lobbyId, {
        candidateId: selectedCandidateId.value,
        memberIds: [...selectedMemberIds.value],
      });
      toast.success('卓を確定しました');
      await router.push({
        name: 'game-sessions-detail',
        params: { gameSessionId: created.id },
      });
    } catch (err) {
      if (err instanceof ApiError && err.status === 409) {
        toast.error('この募集枠はすでに確定されています');
        onConflict();
      } else {
        toast.error('卓の確定に失敗しました');
      }
    } finally {
      loading.value = false;
    }
  }

  return {
    step,
    selectedCandidateId,
    selectedMemberIds,
    loading,
    candidateOptions,
    selectedCount,
    canProceedCandidate,
    canProceedMembers,
    capacityMismatch,
    isWarnedMember,
    selectCandidate,
    toggleMember,
    goNext,
    goBack,
    reset,
    confirm,
  };
};
