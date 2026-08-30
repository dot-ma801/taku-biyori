import { ref, watch } from 'vue';
import { useRouter } from 'vue-router';

import { createLobby } from '@/api/lobby';
import { ApiError } from '@/lib/api-client';
import {
  parseMaxMembers,
  getMaxMembersError,
} from '@/features/Lobby/Edit/composables/maxMembersValidation';
import type { PendingCandidateDate } from '@/utils/pendingCandidateDates';
import {
  getPendingTimeLabelErrors,
  toCandidateDateInputs,
} from '@/utils/pendingCandidateDates';

export const useCreateLobby = () => {
  const router = useRouter();

  const title = ref('');
  const scenarioName = ref('');
  const maxMembers = ref('');
  const description = ref('');
  const openUntil = ref('');
  const location = ref('');
  const pendingDates = ref<PendingCandidateDate[]>([]);

  const loading = ref(false);
  /** バリデーション・API エラーのメッセージ一覧。1件ずつアラート表示する */
  const errorMessages = ref<string[]>([]);

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

    // 候補日は募集枠の存在意義であるため、作成時点で1件以上必須（design-v1.1 §6）
    if (pendingDates.value.length === 0) {
      errors.push('候補日を1件以上指定してください');
    }

    errors.push(...getPendingTimeLabelErrors(pendingDates.value));

    return errors;
  }

  async function submit() {
    errorMessages.value = validate();
    if (errorMessages.value.length > 0) {
      return;
    }

    loading.value = true;

    try {
      const parsedMaxMembers = parseMaxMembers(maxMembers.value);

      const lobby = await createLobby({
        title: title.value,
        ...(scenarioName.value && { scenarioName: scenarioName.value }),
        ...(parsedMaxMembers !== null && { maxPlayers: parsedMaxMembers }),
        ...(description.value && { description: description.value }),
        ...(openUntil.value && { openUntil: openUntil.value }),
        ...(location.value && { location: location.value }),
        candidateDates: toCandidateDateInputs(pendingDates.value),
      });

      router.push({ name: 'lobbies-detail', params: { lobbyId: lobby.id } });
    } catch (err) {
      if (err instanceof ApiError) {
        errorMessages.value = [err.message];
      } else {
        console.error(err);
        errorMessages.value = ['エラーが発生しました'];
      }
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
    submit,
    cancel,
  };
};
