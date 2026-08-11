import { onMounted, ref, watch } from 'vue';
import { useRouter } from 'vue-router';
import {
  bulkUpdateLobbyAvailabilityDates,
  getLobby,
  listLobbyAvailabilityDates,
  updateLobby,
} from '@/api/lobby';
import { ApiError } from '@/lib/api-client';
import {
  getMaxMembersError,
  parseMaxMembers,
} from '@/features/Lobby/Edit/composables/maxMembersValidation';
import type { PendingCandidateDate } from '@/features/Lobby/Edit/composables/pendingCandidateDates';
import {
  getPendingDateNoteErrors,
  toCandidateDateInputs,
} from '@/features/Lobby/Edit/composables/pendingCandidateDates';

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
      const [lobby, availabilityDates] = await Promise.all([
        getLobby(id),
        listLobbyAvailabilityDates(id),
      ]);
      title.value = lobby.title;
      scenarioName.value = lobby.scenarioName ?? '';
      maxMembers.value =
        lobby.maxPlayers !== null && lobby.maxPlayers !== undefined
          ? String(lobby.maxPlayers)
          : '';
      description.value = lobby.description ?? '';
      openUntil.value = lobby.openUntil ?? '';
      location.value = lobby.location ?? '';
      pendingDates.value = availabilityDates.map((date) => ({
        date: date.date,
        dateNote: date.dateNote ?? '',
      }));
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

    // 候補日は募集枠の存在意義であるため、更新時も1件以上必須（design-v1.1 §6）
    if (pendingDates.value.length === 0) {
      errors.push('候補日を1件以上指定してください');
    }

    errors.push(...getPendingDateNoteErrors(pendingDates.value));

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
      await bulkUpdateLobbyAvailabilityDates(id, {
        dates: toCandidateDateInputs(pendingDates.value),
      });

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
    scenarioName,
    maxMembers,
    description,
    openUntil,
    location,
    pendingDates,
    loading,
    errorMessages,
    fetchError,
    fetchInitialValues,
    submit,
    cancel,
  };
};
