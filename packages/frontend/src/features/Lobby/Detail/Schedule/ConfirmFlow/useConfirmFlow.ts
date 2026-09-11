import { computed, ref, toValue, watch } from 'vue';
import type { MaybeRefOrGetter } from 'vue';
import { LobbyStatus, normalizeTimeLabel } from '@taku-biyori/shared';
import { createGameSession } from '@/api/game-session';
import { getSchedulePoll, updateLobbyStatus } from '@/api/lobby';
import { useToast } from '@/composables/useToast';
import { formatDateWithWeekday } from '@/utils/date';
import {
  getDraftFieldCounter,
  isDraftValid,
} from '@/features/Lobby/Detail/Schedule/ConfirmFlow/draftValidation';
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
 * 「日程を確定する」ダイアログの状態を所有する。
 * 候補日は最新の SchedulePoll からこの composable が読み、親が持つ LobbyDetailModel を
 * 書き換えない。作成成功だけを onCreated で親に通知する。
 *
 * 開催日は**日程調整の候補日からしか選べない**。直接日付を入れる経路は
 * 「日程調整の結果を確定する」という操作の意味とずれるため持たない
 * （日程が決まっている卓は、作成画面の「開催日を入れる」で立てる）。
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
  // 開催日は選択中の候補日から導出する
  const scheduledAt = computed(() => selectedCandidateDate.value?.date ?? '');
  /** 表示用に整形した開催日。整形はコンポーネントではなくここで済ませる */
  const scheduledAtLabel = computed(() =>
    scheduledAt.value === '' ? '' : formatDateWithWeekday(scheduledAt.value),
  );
  const selectedEntries = computed(() =>
    entries.value.filter((entry) => selectedEntryIds.value.has(entry.id)),
  );
  const selectedCount = computed(() => selectedEntryIds.value.size);
  const canProceedCandidate = computed(() => scheduledAt.value !== '');
  const canProceedEntries = computed(() => selectedCount.value > 0);

  /** 時間帯の文字数カウンター。候補日の入力と同じ `N / MAX` 形式 */
  const timeLabelCounter = computed(() =>
    getDraftFieldCounter('timeLabel', draft.value.timeLabel),
  );
  /**
   * 確定できるか。
   *
   * 上書き項目は**すべて** API の契約（`CreateGameSessionInputSchema`）で長さが
   * 決まっている。超えたまま送ると 400 が返るだけで、画面には「日程の確定に
   * 失敗しました」としか出せず、どこを直せばよいか伝わらない。送る前にここで止める。
   */
  const canConfirm = computed(
    () =>
      canProceedCandidate.value &&
      canProceedEntries.value &&
      isDraftValid(draft.value),
  );
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
    selectedCandidateId.value = null;
    selectedEntryIds.value = new Set();
    draft.value = emptyDraft();
    await loadLatestPoll();
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
    const normalizedTimeLabel = normalizeTimeLabel(values.timeLabel);
    return {
      scheduledAt: scheduledAt.value,
      entryIds: [...selectedEntryIds.value],
      ...(values.title ? { title: values.title } : {}),
      ...(values.scenarioName ? { scenarioName: values.scenarioName } : {}),
      ...(values.location ? { location: values.location } : {}),
      // 候補日のひとことと同じく正規化して送る。検証（getTimeLabelError）が
      // 正規化後の長さで数えているので、生値のまま送ると前後の空白ぶんだけ
      // 契約（max 20）を超えて 400 になりうる
      ...(normalizedTimeLabel ? { timeLabel: normalizedTimeLabel } : {}),
      ...(values.description ? { description: values.description } : {}),
    };
  }

  /**
   * 日程が決まったら新しい参加の受付は閉じる。
   *
   * 確定したあとに増えた参加者は当日の参加者に入っておらず、ホストが気づかないまま
   * 「参加したのに席が無い」状態になる。受付中のときだけ閉じ、閉じ損ねても
   * 確定そのものは成功として扱う（ホストは「追加募集」でいつでも開き直せる）。
   */
  async function closeReceptionAfterConfirm() {
    if (toValue(lobby).status !== LobbyStatus.open) return;
    try {
      await updateLobbyStatus(toValue(lobby).id, { status: 'closed' });
    } catch {
      toast.error('受付の終了に失敗しました。必要なら手動で閉じてください');
    }
  }

  async function confirm() {
    if (loading.value || !canConfirm.value) return;
    loading.value = true;
    try {
      const gameSession = await createGameSession(
        toValue(lobby).id,
        createInput(),
      );
      await closeReceptionAfterConfirm();
      toast.success('日程を確定しました');
      onCreated(gameSession);
    } catch (error) {
      if (error instanceof ApiError && error.status === 409) {
        toast.error('ロビーの状態が変更されています。読み込み直してください');
      } else {
        toast.error('日程の確定に失敗しました');
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
    scheduledAtLabel,
    selectedEntryIds,
    selectedEntries,
    selectedCount,
    candidateOptions,
    draft,
    canProceedCandidate,
    canProceedEntries,
    canConfirm,
    timeLabelCounter,
    capacityMismatch,
    selectCandidate,
    toggleEntry,
    isWarnedEntry,
    getEntryAnswer,
    goNext,
    goBack,
    reset,
    confirm,
  };
};
