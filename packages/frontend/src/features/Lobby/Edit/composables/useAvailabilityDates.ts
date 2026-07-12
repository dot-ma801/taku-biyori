import { ref, onMounted } from 'vue';
import type { AvailabilityDate } from '@taku-biyori/shared';
import {
  listAvailabilityDates,
  bulkUpdateAvailabilityDates,
} from '@/api/game-session';

export const useAvailabilityDates = (gameSessionId: string) => {
  const availabilityDates = ref<AvailabilityDate[]>([]);
  const loading = ref(false);
  const errorMessage = ref('');

  async function fetchAvailabilityDates() {
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

  onMounted(fetchAvailabilityDates);

  // BaseDatePicker(multiple) の v-model と同期するハンドラ
  // 現在の選択状態をそのまま PUT して、差分調整はサーバーに任せる
  async function syncDates(newDates: string[]) {
    errorMessage.value = '';
    try {
      availabilityDates.value = await bulkUpdateAvailabilityDates(
        gameSessionId,
        { dates: newDates },
      );
    } catch {
      errorMessage.value = '候補日の更新に失敗しました';
      await fetchAvailabilityDates();
    }
  }

  return {
    availabilityDates,
    loading,
    errorMessage,
    syncDates,
  };
};
