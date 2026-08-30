import { onMounted, ref } from 'vue';
import { useRouter } from 'vue-router';

import { getGameSession, updateGameSession } from '@/api/game-session';
import { ApiError } from '@/lib/api-client';

/**
 * 開催の編集フォーム。
 *
 * **初期値には解決済みの表示値ではなく `overrides` の生値を使う**（design-v2 §5-5）。
 * 解決済みの値を入れると、上書きしていない項目にもロビーの値が見え、そのまま保存すると
 * 意図しない上書きが発生して以後ロビーを改名しても追随しなくなる。
 *
 * 保存時は「空欄 → `null`」で送る。`null` は上書きの解除を意味する。
 */
export const useUpdateGameSession = (lobbyId: string, id: string) => {
  const router = useRouter();

  // 上書き項目。空文字は「上書きしない」を表す
  const title = ref('');
  const scenarioName = ref('');
  const location = ref('');
  const timeLabel = ref('');

  // 上書きではないセッション固有のファクト
  const description = ref('');
  const scheduledAt = ref('');

  /** ロビーの既定値。プレースホルダで「未入力ならこれが出る」と示すために持つ */
  const lobbyDefaults = ref<{
    title: string;
    scenarioName: string | null;
    location: string | null;
  } | null>(null);

  const loading = ref(false);
  const errorMessage = ref('');

  async function fetchInitialValues() {
    loading.value = true;
    errorMessage.value = '';

    try {
      const gameSession = await getGameSession(lobbyId, id);
      // 生値をそのまま入れる。null は空欄（＝上書きなし）
      title.value = gameSession.overrides.title ?? '';
      scenarioName.value = gameSession.overrides.scenarioName ?? '';
      location.value = gameSession.overrides.location ?? '';
      timeLabel.value = gameSession.overrides.timeLabel ?? '';

      description.value = gameSession.description ?? '';
      scheduledAt.value = gameSession.scheduledAt;

      lobbyDefaults.value = {
        title: gameSession.lobby.title,
        scenarioName: gameSession.lobby.scenarioName,
        location: gameSession.lobby.location,
      };
    } catch (err) {
      errorMessage.value =
        err instanceof ApiError ? err.message : 'エラーが発生しました';
    } finally {
      loading.value = false;
    }
  }

  onMounted(fetchInitialValues);

  /** 空欄は null（上書きの解除）として送る */
  const orNull = (value: string): string | null => value.trim() || null;

  async function submit() {
    errorMessage.value = '';

    // 開催は必ず日程を持つ（design-v2 §3-7）
    if (!scheduledAt.value) {
      errorMessage.value = '開催日を選択してください';
      return;
    }

    loading.value = true;

    try {
      await updateGameSession(lobbyId, id, {
        scheduledAt: scheduledAt.value,
        title: orNull(title.value),
        scenarioName: orNull(scenarioName.value),
        location: orNull(location.value),
        timeLabel: orNull(timeLabel.value),
        description: orNull(description.value),
      });

      router.push({
        name: 'game-sessions-detail',
        params: { lobbyId, gameSessionId: id },
      });
    } catch (err) {
      errorMessage.value =
        err instanceof ApiError ? err.message : 'エラーが発生しました';
    } finally {
      loading.value = false;
    }
  }

  function cancel() {
    router.back();
  }

  return {
    fetchInitialValues,
    title,
    scenarioName,
    location,
    timeLabel,
    description,
    scheduledAt,
    lobbyDefaults,
    loading,
    errorMessage,
    submit,
    cancel,
  };
};
