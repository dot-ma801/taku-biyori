import { ref, onMounted } from 'vue';
import { useRouter } from 'vue-router';

import { getGameSession, updateGameSession } from '@/api/game-session';
import { ApiError } from '@/lib/api-client';
import {
  parseMaxMembers,
  getMaxMembersError,
} from '@/features/GameSession/Edit/maxMembersValidation';

export const useUpdateGameSession = (id: string) => {
  const router = useRouter();

  const title = ref('');
  const scenarioName = ref('');
  const maxMembers = ref('');
  const description = ref('');
  const scheduledAt = ref('');
  const location = ref('');

  const loading = ref(false);
  const errorMessage = ref('');

  async function fetchInitialValues() {
    loading.value = true;
    errorMessage.value = '';

    try {
      const gameSession = await getGameSession(id);
      title.value = gameSession.title;
      scenarioName.value = gameSession.scenarioName ?? '';
      maxMembers.value =
        gameSession.maxMembers != null ? String(gameSession.maxMembers) : '';
      description.value = gameSession.description ?? '';
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
    errorMessage.value = '';

    const maxMembersError = getMaxMembersError(maxMembers.value);
    if (maxMembersError) {
      errorMessage.value = maxMembersError;
      return;
    }

    // 卓は日程が確定した状態でのみ存在する（design-v1.1 §8）
    if (!scheduledAt.value) {
      errorMessage.value = '開催日を選択してください';
      return;
    }

    loading.value = true;

    try {
      const parsedMaxMembers = parseMaxMembers(maxMembers.value);

      await updateGameSession(id, {
        ...(title.value?.trim() ? { title: title.value } : {}),
        ...(scenarioName.value
          ? { scenarioName: scenarioName.value }
          : { scenarioName: null }),
        ...(parsedMaxMembers !== null
          ? { maxMembers: parsedMaxMembers }
          : { maxMembers: null }),
        ...(description.value
          ? { description: description.value }
          : { description: null }),
        // openUntil は募集枠の関心事なので編集フォームから外した。
        // 送らないことでサーバ側の値（作成時にセットした締め切り日）を保持する。
        scheduledAt: scheduledAt.value,
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
    title,
    scenarioName,
    maxMembers,
    description,
    scheduledAt,
    location,
    loading,
    errorMessage,
    submit,
    cancel,
  };
};
