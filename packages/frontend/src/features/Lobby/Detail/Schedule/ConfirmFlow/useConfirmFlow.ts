import { computed, ref, toValue } from 'vue';
import type { MaybeRefOrGetter } from 'vue';
import { createGameSession } from '@/api/game-session';
import { getSchedulePoll } from '@/api/lobby';
import { useToast } from '@/composables/useToast';
import { useScheduleView } from '@/features/Lobby/Detail/Schedule/useScheduleView';
import { ApiError } from '@/lib/api-client';
import type { GameSessionModel } from '@/models/game-session';
import type { LobbyDetailModel, LobbyEntryModel } from '@/models/lobby';
import type {
  CandidateDateModel,
  SchedulePollModel,
} from '@/models/schedule-poll';
import type { Answer } from '@/features/Lobby/Detail/Schedule/types';

export type GameSessionDraft = {
  title: string;
  scenarioName: string;
  location: string;
  timeLabel: string;
  description: string;
};

const emptyDraft = (): GameSessionDraft => ({
  title: '',
  scenarioName: '',
  location: '',
  timeLabel: '',
  description: '',
});

/**
 * 「開催を追加する」ダイアログの状態を所有する。
 * 候補日は最新の SchedulePoll からこの composable が読み、親が持つ LobbyDetailModel を
 * 書き換えない。作成成功だけを onCreated で親に通知する。
 */
export const useConfirmFlow = (
  lobby: MaybeRefOrGetter<LobbyDetailModel>,
  onCreated: (gameSession: GameSessionModel) => void,
) => {
  const toast = useToast();
  const { getAnswer, answerCounts } = useScheduleView(
    () => [],
    () => new Map(),
  );

  const step = ref<1 | 2 | 3>(1);
  const poll = ref<SchedulePollModel | null>(null);
  const loadingPoll = ref(false);
  const loading = ref(false);
  const selectedCandidateId = ref<string | null>(null);
  const scheduledAt = ref('');
  const selectedEntryIds = ref<Set<string>>(new Set());
  const draft = ref<GameSessionDraft>(emptyDraft());

  const entries = computed<LobbyEntryModel[]>(
    () => toValue(lobby).activeEntries,
  );
  const candidateDates = computed<CandidateDateModel[]>(
    () => poll.value?.candidateDates ?? [],
  );
  const candidateOptions = computed(() =>
    candidateDates.value.map((date) => ({
      id: date.id,
      date: date.date,
      timeLabel: date.timeLabel,
      counts: answerCounts(date, entries.value),
    })),
  );
  const selectedCandidateDate = computed(
    () =>
      candidateDates.value.find(
        (date) => date.id === selectedCandidateId.value,
      ) ?? null,
  );
  const selectedEntries = computed(() =>
    entries.value.filter((entry) => selectedEntryIds.value.has(entry.id)),
  );
  const selectedCount = computed(() => selectedEntryIds.value.size);
  const canProceedDate = computed(() => scheduledAt.value !== '');
  const canProceedEntries = computed(() => selectedCount.value > 0);
  const capacityMismatch = computed(() => {
    const maxPlayers = toValue(lobby).maxPlayers;
    return maxPlayers !== null && maxPlayers !== selectedCount.value;
  });

  function defaultEntryIds(date: CandidateDateModel): Set<string> {
    return new Set(
      entries.value
        .filter((entry) => {
          const answer = getAnswer(date, entry.id);
          return answer === 'ok' || answer === 'maybe';
        })
        .map((entry) => entry.id),
    );
  }

  function selectCandidate(id: string) {
    const date = candidateDates.value.find((candidate) => candidate.id === id);
    if (!date) return;
    selectedCandidateId.value = id;
    scheduledAt.value = date.date;
    selectedEntryIds.value = defaultEntryIds(date);
  }

  function setScheduledAt(date: string) {
    scheduledAt.value = date;
    const candidate = candidateDates.value.find((item) => item.date === date);
    if (candidate) {
      selectCandidate(candidate.id);
      return;
    }
    selectedCandidateId.value = null;
    selectedEntryIds.value = new Set();
  }

  function toggleEntry(id: string) {
    const next = new Set(selectedEntryIds.value);
    if (next.has(id)) next.delete(id);
    else next.add(id);
    selectedEntryIds.value = next;
  }

  function isWarnedEntry(entryId: string): boolean {
    const candidate = selectedCandidateDate.value;
    if (!candidate) return false;
    const answer = getAnswer(candidate, entryId);
    return answer === 'ng' || answer === null;
  }

  function getEntryAnswer(entryId: string): Answer | null {
    const candidate = selectedCandidateDate.value;
    return candidate ? getAnswer(candidate, entryId) : null;
  }

  function goNext() {
    if (step.value === 1 && canProceedDate.value) step.value = 2;
    else if (step.value === 2 && canProceedEntries.value) step.value = 3;
  }

  function goBack() {
    if (step.value === 3) step.value = 2;
    else if (step.value === 2) step.value = 1;
  }

  async function loadLatestPoll() {
    const pollId = toValue(lobby).schedulePolls[0]?.id;
    if (!pollId) {
      poll.value = null;
      return;
    }
    loadingPoll.value = true;
    try {
      poll.value = await getSchedulePoll(toValue(lobby).id, pollId);
    } catch {
      poll.value = null;
      toast.error('候補日の取得に失敗しました');
    } finally {
      loadingPoll.value = false;
    }
  }

  async function reset() {
    step.value = 1;
    selectedCandidateId.value = null;
    scheduledAt.value = '';
    selectedEntryIds.value = new Set();
    draft.value = emptyDraft();
    await loadLatestPoll();
  }

  function createInput() {
    const values = draft.value;
    return {
      scheduledAt: scheduledAt.value,
      entryIds: [...selectedEntryIds.value],
      ...(values.title ? { title: values.title } : {}),
      ...(values.scenarioName ? { scenarioName: values.scenarioName } : {}),
      ...(values.location ? { location: values.location } : {}),
      ...(values.timeLabel ? { timeLabel: values.timeLabel } : {}),
      ...(values.description ? { description: values.description } : {}),
    };
  }

  async function confirm() {
    if (loading.value || !canProceedDate.value || !canProceedEntries.value)
      return;
    loading.value = true;
    try {
      const gameSession = await createGameSession(
        toValue(lobby).id,
        createInput(),
      );
      toast.success('開催を追加しました');
      onCreated(gameSession);
    } catch (error) {
      if (error instanceof ApiError && error.status === 409) {
        toast.error('ロビーの状態が変更されています。読み込み直してください');
      } else {
        toast.error('開催の追加に失敗しました');
      }
    } finally {
      loading.value = false;
    }
  }

  return {
    step,
    loading,
    loadingPoll,
    selectedCandidateId,
    scheduledAt,
    selectedEntryIds,
    selectedEntries,
    selectedCount,
    candidateOptions,
    draft,
    canProceedDate,
    canProceedEntries,
    capacityMismatch,
    selectCandidate,
    setScheduledAt,
    toggleEntry,
    isWarnedEntry,
    getEntryAnswer,
    goNext,
    goBack,
    reset,
    confirm,
  };
};
