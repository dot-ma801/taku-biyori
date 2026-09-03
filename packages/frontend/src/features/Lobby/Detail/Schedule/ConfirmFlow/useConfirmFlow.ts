import { computed, ref, toValue, watch } from 'vue';
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

/**
 * 開催日の決め方。design-v2 §7 のステップ1は
 * 「候補日から選ぶ」と「直接日付を入れる」の2経路を持つ。
 * 日程調整を回していないロビー（直接卓立て）は候補日が無いので direct しか通らない。
 */
export type DateMode = 'candidate' | 'direct';

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
  isOpen: MaybeRefOrGetter<boolean>,
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
  const dateMode = ref<DateMode>('candidate');
  /** 直接入力の開催日（YYYY-MM-DD）。候補日経路では使わない */
  const directDate = ref('');
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
  const selectedCandidateDate = computed(() =>
    dateMode.value === 'candidate'
      ? (candidateDates.value.find(
          (date) => date.id === selectedCandidateId.value,
        ) ?? null)
      : null,
  );
  // 開催日は選んだ経路から導出する。候補日経路なら選択中の候補日、直接入力なら入力値
  const scheduledAt = computed(() =>
    dateMode.value === 'direct'
      ? directDate.value
      : (selectedCandidateDate.value?.date ?? ''),
  );
  const selectedEntries = computed(() =>
    entries.value.filter((entry) => selectedEntryIds.value.has(entry.id)),
  );
  const selectedCount = computed(() => selectedEntryIds.value.size);
  const canProceedCandidate = computed(() => scheduledAt.value !== '');
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
    selectedEntryIds.value = defaultEntryIds(date);
  }

  /**
   * 開催日の決め方を切り替える。
   * 経路をまたいで選択が残ると「候補日を選んだのに別の日で作る」事故になるため、
   * 日付も参加者の既定選択も捨てて選び直させる。
   */
  function setDateMode(mode: DateMode) {
    if (dateMode.value === mode) return;
    dateMode.value = mode;
    selectedCandidateId.value = null;
    directDate.value = '';
    selectedEntryIds.value = new Set();
  }

  /**
   * 直接入力の開催日を決める。
   *
   * 直接入力の日付には日程回答が無いので、候補日経路の「ok / maybe を既定で選ぶ」に
   * あたる絞り込みができない。在籍している entry を全員選んだ状態から外させる。
   */
  function setDirectDate(date: string) {
    directDate.value = date;
    selectedEntryIds.value = date
      ? new Set(entries.value.map((entry) => entry.id))
      : new Set();
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
    if (step.value === 1 && canProceedCandidate.value) step.value = 2;
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
    dateMode.value = 'candidate';
    selectedCandidateId.value = null;
    directDate.value = '';
    selectedEntryIds.value = new Set();
    draft.value = emptyDraft();
    await loadLatestPoll();
    // 選べる候補日が無いロビー（日程調整を回していない・直接卓立て）で
    // 候補日待ちのまま詰まらせない
    if (candidateDates.value.length === 0) dateMode.value = 'direct';
  }

  // 親が v-model を true にして開くケースでは BaseDialog（Dialog.Root）から
  // update:model-value が返ってこないため、開閉そのものを監視して初期化する。
  watch(
    () => toValue(isOpen),
    (open) => {
      if (open) {
        void reset();
      }
    },
    { immediate: true },
  );

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
    if (loading.value || !canProceedCandidate.value || !canProceedEntries.value)
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
    dateMode,
    directDate,
    selectedCandidateId,
    scheduledAt,
    selectedEntryIds,
    selectedEntries,
    selectedCount,
    candidateOptions,
    draft,
    canProceedCandidate,
    canProceedEntries,
    capacityMismatch,
    selectCandidate,
    setDateMode,
    setDirectDate,
    toggleEntry,
    isWarnedEntry,
    getEntryAnswer,
    goNext,
    goBack,
    reset,
    confirm,
  };
};
