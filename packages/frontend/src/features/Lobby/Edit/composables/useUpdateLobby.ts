import { computed, onMounted, ref, watch } from 'vue';
import { useRouter } from 'vue-router';
import {
  getLobby,
  getSchedulePoll,
  replaceCandidateDates,
  updateLobby,
} from '@/api/lobby';
import { ApiError } from '@/lib/api-client';
import {
  getMaxMembersError,
  parseMaxMembers,
} from '@/features/Lobby/Edit/composables/maxMembersValidation';
import type { PendingCandidateDate } from '@/utils/pendingCandidateDates';
import {
  getPendingTimeLabelErrors,
  toCandidateDateInputs,
} from '@/utils/pendingCandidateDates';

export const useUpdateLobby = (id: string) => {
  const router = useRouter();

  const title = ref('');
  const scenarioName = ref('');
  const maxMembers = ref('');
  const description = ref('');
  const openUntil = ref('');
  const location = ref('');
  const pendingDates = ref<PendingCandidateDate[]>([]);
  const loading = ref(false);
  /** submit（更新）失敗時のエラーメッセージ一覧。1件ずつアラート表示する */
  const errorMessages = ref<string[]>([]);
  /** 初期取得失敗時のエラー。フォーム自体を表示できない状態を表す */
  const fetchError = ref('');
  /**
   * 編集対象の最新の日程調整 id（ロビー詳細の `schedulePolls[0].id`）。
   * 調整が1件も無いロビーでは null になり、候補日の更新は行わない
   * （調整をやり直す＝新しい poll を作る導線は別 PR の担当）。
   */
  const pollId = ref<string | null>(null);
  const hasSchedulePoll = computed(() => pollId.value !== null);

  /**
   * 取得時点のロビー名。**フォームの下書き（`title`）とは別に持つ。**
   * パンくずのラベルに下書きを使うと、保存前に打った文字がそのまま
   * 「そのロビーの名前」として出てしまい、リンク先の実体と食い違う。
   */
  const savedTitle = ref('');

  // エラー表示中は送信ボタンを無効化しているため、
  // 入力の変更を修正の開始とみなしてエラーをクリアし、再送信できるようにする。
  // flush: 'sync' で変更の瞬間にクリアし、submit が直後に設定するエラーを消さない
  watch(
    [
      title,
      scenarioName,
      maxMembers,
      description,
      openUntil,
      location,
      pendingDates,
    ],
    () => {
      errorMessages.value = [];
    },
    { flush: 'sync' },
  );

  /** Loads the lobby values to initialize the edit form. */
  async function fetchInitialValues() {
    loading.value = true;
    fetchError.value = '';

    try {
      const lobby = await getLobby(id);
      title.value = lobby.title;
      savedTitle.value = lobby.title;
      scenarioName.value = lobby.scenarioName ?? '';
      maxMembers.value =
        lobby.maxPlayers !== null && lobby.maxPlayers !== undefined
          ? String(lobby.maxPlayers)
          : '';
      description.value = lobby.description ?? '';
      openUntil.value = lobby.openUntil ?? '';
      location.value = lobby.location ?? '';

      pollId.value = lobby.schedulePolls[0]?.id ?? null;
      if (pollId.value) {
        const poll = await getSchedulePoll(id, pollId.value);
        pendingDates.value = poll.candidateDates.map((date) => ({
          date: date.date,
          timeLabel: date.timeLabel ?? '',
        }));
      } else {
        pendingDates.value = [];
      }
    } catch (err) {
      fetchError.value =
        err instanceof ApiError ? err.message : 'エラーが発生しました';
    } finally {
      loading.value = false;
    }
  }

  onMounted(fetchInitialValues);

  /** フォーム全体を検証し、エラーメッセージを全件返す（早期 return せず収集する） */
  function validate(): string[] {
    const errors: string[] = [];

    if (title.value.trim() === '') {
      errors.push('タイトルを入力してください');
    }

    const maxMembersError = getMaxMembersError(maxMembers.value);
    if (maxMembersError) {
      errors.push(maxMembersError);
    }

    // 既存の日程調整がある場合だけ候補日を編集できる。
    // 調整がないロビーでは候補日入力を表示せず、基本情報のみ更新可能にする。
    if (hasSchedulePoll.value && pendingDates.value.length === 0) {
      errors.push('候補日を1件以上指定してください');
    }

    errors.push(...getPendingTimeLabelErrors(pendingDates.value));

    return errors;
  }

  /** Validates and saves the lobby, then navigates to its detail page. */
  async function submit() {
    errorMessages.value = validate();
    if (errorMessages.value.length > 0) {
      return;
    }

    loading.value = true;
    try {
      const parsedMaxMembers = parseMaxMembers(maxMembers.value);
      await updateLobby(id, {
        title: title.value,
        scenarioName: scenarioName.value || null,
        maxPlayers: parsedMaxMembers,
        description: description.value || null,
        openUntil: openUntil.value || null,
        location: location.value || null,
      });

      // 調整が1件も無いロビーでは候補日の更新導線を出していないため、ここには来ない
      if (pollId.value) {
        await replaceCandidateDates(id, pollId.value, {
          candidateDates: toCandidateDateInputs(pendingDates.value),
        });
      }

      await router.push({ name: 'lobbies-detail', params: { lobbyId: id } });
    } catch (err) {
      errorMessages.value = [
        err instanceof ApiError ? err.message : 'エラーが発生しました',
      ];
    } finally {
      loading.value = false;
    }
  }

  function cancel() {
    router.back();
  }

  return {
    title,
    savedTitle,
    scenarioName,
    maxMembers,
    description,
    openUntil,
    location,
    pendingDates,
    loading,
    errorMessages,
    fetchError,
    hasSchedulePoll,
    fetchInitialValues,
    submit,
    cancel,
  };
};
