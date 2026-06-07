import { ref, onMounted } from 'vue';
import type { AvailabilityDate } from '@taku-biyori/shared';
import {
  listAvailabilityDates,
  addAvailabilityDate,
  deleteAvailabilityDate,
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
  // 追加: 既存にない日付が渡されたら POST
  // 削除: 既存にある日付が渡されなかったら DELETE
  async function syncDates(newDates: string[]) {
    errorMessage.value = '';

    const currentDates = availabilityDates.value.map((d) => d.date);

    // 追加された日付
    const toAdd = newDates.filter((d) => !currentDates.includes(d));
    // 削除された日付
    const toDelete = availabilityDates.value.filter(
      (d) => !newDates.includes(d.date),
    );

    try {
      await Promise.all([
        ...toAdd.map((date) =>
          addAvailabilityDate(gameSessionId, { date }).then((created) => {
            availabilityDates.value.push(created);
          }),
        ),
        ...toDelete.map((d) =>
          deleteAvailabilityDate(gameSessionId, d.id).then(() => {
            availabilityDates.value = availabilityDates.value.filter(
              (a) => a.id !== d.id,
            );
          }),
        ),
      ]);
    } catch {
      errorMessage.value = '候補日の更新に失敗しました';
      // エラー時はサーバー状態に戻す
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
