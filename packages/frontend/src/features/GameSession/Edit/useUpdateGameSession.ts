import { ref, onMounted } from 'vue';
import { useRouter } from 'vue-router';

import { getGameSession, updateGameSession } from '@/api/game-session';
import { ApiError } from '@/lib/api-client';

export const useUpdateGameSession = (id: string) => {
  const router = useRouter();

  const title = ref('');
  const scenarioName = ref('');
  const maxMembers = ref('');
  const description = ref('');
  const openUntil = ref('');
  const scheduledAt = ref('');
  const location = ref('');

  const isScheduled = ref(false);
  const loading = ref(false);
  const errorMessage = ref('');

  async function fetchInitialValues() {
    loading.value = true;
    errorMessage.value = '';

    try {
      const gameSession = await getGameSession(id);
      isScheduled.value = gameSession.scheduledAt != null;
      title.value = gameSession.title;
      scenarioName.value = gameSession.scenarioName ?? '';
      maxMembers.value =
        gameSession.maxMembers != null ? String(gameSession.maxMembers) : '';
      description.value = gameSession.description ?? '';
      openUntil.value = gameSession.openUntil ?? '';
      scheduledAt.value = gameSession.scheduledAt ?? '';
      location.value = gameSession.location ?? '';
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

  onMounted(fetchInitialValues);

  async function submit() {
    loading.value = true;
    errorMessage.value = '';

    try {
      const parsedMaxMembers = Number(maxMembers.value.trim());
      const validMaxMembers =
        maxMembers.value.trim() !== '' &&
        Number.isInteger(parsedMaxMembers) &&
        parsedMaxMembers >= 2 &&
        parsedMaxMembers <= 20;

      await updateGameSession(id, {
        ...(title.value?.trim() ? { title: title.value } : {}),
        ...(scenarioName.value
          ? { scenarioName: scenarioName.value }
          : { scenarioName: null }),
        ...(validMaxMembers
          ? { maxMembers: parsedMaxMembers }
          : { maxMembers: null }),
        ...(description.value
          ? { description: description.value }
          : { description: null }),
        ...(openUntil.value
          ? { openUntil: openUntil.value }
          : { openUntil: null }),
        ...(scheduledAt.value
          ? { scheduledAt: scheduledAt.value }
          : { scheduledAt: null }),
        ...(location.value ? { location: location.value } : { location: null }),
      });

      router.push({
        name: 'game-sessions-detail',
        params: { gameSessionId: id },
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
    isScheduled,
    title,
    scenarioName,
    maxMembers,
    description,
    openUntil,
    scheduledAt,
    location,
    loading,
    errorMessage,
    submit,
    cancel,
  };
};
