import { ref, onMounted } from 'vue';
import type { AvailabilityDate } from '@taku-biyori/shared';
import { listAvailabilityDates } from '@/api/game-session';

export const useScheduleDisplay = (gameSessionId: string) => {
  const availabilityDates = ref<AvailabilityDate[]>([]);
  const loading = ref(false);
  const errorMessage = ref('');

  async function fetch() {
    loading.value = true;
    errorMessage.value = '';
    try {
      availabilityDates.value = await listAvailabilityDates(gameSessionId);
    } catch {
      errorMessage.value = '候補日の取得に失敗しました';
    } finally {
      loading.value = false;
    }
  }

  onMounted(fetch);

  return {
    availabilityDates,
    loading,
    errorMessage,
    fetch,
  };
};
