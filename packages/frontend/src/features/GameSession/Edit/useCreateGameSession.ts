import { ref } from 'vue';
import { useRouter } from 'vue-router';

import { createGameSession, addAvailabilityDate } from '@/api/game-session';
import { ApiError } from '@/lib/api-client';

export const useCreateGameSession = () => {
  const router = useRouter();

  const title = ref('');
  const scenarioName = ref('');
  const maxMembers = ref('');
  const description = ref('');
  const openUntil = ref('');
  const scheduledAt = ref('');
  const location = ref('');
  const pendingDates = ref<string[]>([]);

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
      const parsedMaxMembers = Number(maxMembers.value.trim());
      const validMaxMembers =
        maxMembers.value.trim() !== '' &&
        Number.isInteger(parsedMaxMembers) &&
        parsedMaxMembers > 0;

      const gameSession = await createGameSession({
        title: title.value,
        ...(scenarioName.value && { scenarioName: scenarioName.value }),
        ...(validMaxMembers && { maxMembers: parsedMaxMembers }),
        ...(description.value && { description: description.value }),
        ...(openUntil.value && { openUntil: openUntil.value }),
        ...(scheduledAt.value && { scheduledAt: scheduledAt.value }),
        ...(location.value && { location: location.value }),
      });

      // 候補日が選択されていればセッション作成後に一括 POST
      if (pendingDates.value.length > 0) {
        await Promise.all(
          pendingDates.value.map((date) =>
            addAvailabilityDate(gameSession.id, { date }),
          ),
        );
      }

      router.push({
        name: 'game-session-detail',
        params: { id: gameSession.id },
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
    scheduledAt,
    location,
    pendingDates,
    loading,
    errorMessage,
    submit,
    cancel,
  };
};
