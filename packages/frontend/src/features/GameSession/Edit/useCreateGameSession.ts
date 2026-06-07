import { ref } from 'vue';
import { useRouter } from 'vue-router';

import { createGameSession } from '@/api/game-session';
import { ApiError } from '@/lib/api-client';

export const useCreateGameSession = () => {
  const router = useRouter();

  const title = ref('');
  const scenarioName = ref('');
  const maxMembers = ref('');
  const description = ref('');
  const openUntil = ref('');

  const loading = ref(false);
  const errorMessage = ref('');

  async function submit() {
    loading.value = true;
    errorMessage.value = '';

    try {
      // `&&` の手前が falsy なら false が返り、そうでなければ 値を返す
      // `...` により false なら、何も展開されず、値はそのまま展開される
      // 具体例:
      // ...false -> 何も展開されない
      // ...{ scenarioName: 'シナリオ名' } -> scenarioName: 'シナリオ名' が展開される
      const gameSession = await createGameSession({
        title: title.value,
        ...(scenarioName.value && { scenarioName: scenarioName.value }),
        ...(maxMembers.value && { maxMembers: Number(maxMembers.value) }),
        ...(description.value && { description: description.value }),
        ...(openUntil.value && { openUntil: openUntil.value }),
      });

      router.push({ name: 'game-session-detail', params: { id: gameSession.id } });
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
    loading,
    errorMessage,
    submit,
    cancel,
  };
};
