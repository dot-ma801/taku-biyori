import { ref } from 'vue';
import { useRouter } from 'vue-router';

import { createGameSession } from '@/api/game-session';
import { ApiError } from '@/lib/api-client';
import {
  parseMaxMembers,
  getMaxMembersError,
} from '@/features/GameSession/Edit/maxMembersValidation';

export const useCreateGameSession = () => {
  const router = useRouter();

  const title = ref('');
  const scenarioName = ref('');
  const maxMembers = ref('');
  const description = ref('');
  const scheduledAt = ref('');
  const location = ref('');

  const loading = ref(false);
  const errorMessage = ref('');

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
      // `&&` の手前が falsy なら false が返り、そうでなければ 値を返す
      // `...` により false なら、何も展開されず、値はそのまま展開される
      // 具体例:
      // ...false -> 何も展開されない
      // ...{ scenarioName: 'シナリオ名' } -> scenarioName: 'シナリオ名' が展開される
      const parsedMaxMembers = parseMaxMembers(maxMembers.value);

      const gameSession = await createGameSession({
        title: title.value,
        ...(scenarioName.value && { scenarioName: scenarioName.value }),
        ...(parsedMaxMembers !== null && { maxMembers: parsedMaxMembers }),
        ...(description.value && { description: description.value }),
        ...(location.value && { location: location.value }),
        scheduledAt: scheduledAt.value,
      });

      router.push({
        name: 'game-sessions-detail',
        params: { gameSessionId: gameSession.id },
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
