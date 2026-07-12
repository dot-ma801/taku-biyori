import { ref } from 'vue';
import { useRouter } from 'vue-router';

import { createLobby } from '@/api/lobby';
import { ApiError } from '@/lib/api-client';
import {
  parseMaxMembers,
  getMaxMembersError,
} from '@/features/Lobby/Edit/composables/maxMembersValidation';

export const useCreateLobby = () => {
  const router = useRouter();

  const title = ref('');
  const scenarioName = ref('');
  const maxMembers = ref('');
  const description = ref('');
  const openUntil = ref('');
  const location = ref('');
  const pendingDates = ref<string[]>([]);

  const loading = ref(false);
  const errorMessage = ref('');

  async function submit() {
    errorMessage.value = '';

    const maxMembersError = getMaxMembersError(maxMembers.value);
    if (maxMembersError) {
      errorMessage.value = maxMembersError;
      return;
    }

    // 候補日は募集枠の存在意義であるため、作成時点で1件以上必須（design-v1.1 §6）
    if (pendingDates.value.length === 0) {
      errorMessage.value = '候補日を1件以上指定してください';
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
        candidateDates: pendingDates.value,
      });

      router.push({
        name: 'lobbies-detail',
        params: { lobbyId: lobby.id },
      });
    } catch (err) {
      if (err instanceof ApiError) {
        errorMessage.value = err.message;
      } else {
        errorMessage.value = 'エラーが発生しました';
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
    errorMessage,
    submit,
    cancel,
  };
};
