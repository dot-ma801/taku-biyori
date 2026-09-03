import { computed, ref, watch } from 'vue';
import { useRouter } from 'vue-router';

import { createLobby, getLobby } from '@/api/lobby';
import type { LobbyModel } from '@/models/lobby';
import { createGameSession } from '@/api/game-session';
import { ApiError } from '@/lib/api-client';
import {
  parseMaxMembers,
  getMaxMembersError,
} from '@/features/Lobby/Edit/composables/maxMembersValidation';
import type { PendingCandidateDate } from '@/utils/pendingCandidateDates';
import {
  getPendingTimeLabelErrors,
  toCandidateDateInputs,
} from '@/utils/pendingCandidateDates';
import type { ScheduleMode } from '@/features/Lobby/Edit/composables/schedule-mode';

export const useCreateLobby = () => {
  const router = useRouter();

  const title = ref('');
  const scenarioName = ref('');
  const maxMembers = ref('');
  const description = ref('');
  const openUntil = ref('');
  const location = ref('');
  const pendingDates = ref<PendingCandidateDate[]>([]);

  /**
   * 日程の決め方（design-v2 §7-1）。旧「直接卓を立てる」画面はこのモードに統合した。
   * - `poll`: 候補日を挙げて調整する（既定）
   * - `fixed`: 開催日が決まっている。ロビー作成と同時に開催を1件つくる
   */
  const scheduleMode = ref<ScheduleMode>('poll');
  const scheduledAt = ref('');
  const timeLabel = ref('');
  /**
   * 当日の連絡事項。**開催（GameSession）固有のファクト**で、ロビーの「説明」とは別物
   * （design-v2 §5-5）。`fixed` モードでのみ入力させ、作成する開催に載せる。
   */
  const gameSessionDescription = ref('');

  const loading = ref(false);
  /** バリデーション・API エラーのメッセージ一覧。1件ずつアラート表示する */
  const errorMessages = ref<string[]>([]);
  /**
   * 作成済みのロビー。`fixed` モードで開催の作成に失敗しても、再送信で下書きロビーを
   * 量産しないよう保持し、後続処理だけをやり直す。
   */
  const createdLobby = ref<LobbyModel | null>(null);

  // エラー表示中は送信ボタンを無効化しているため、
  // 入力の変更を修正の開始とみなしてエラーをクリアし、再送信できるようにする。
  // flush: 'sync' で変更の瞬間にクリアし、submit が直後に設定するエラーを消さない
  watch(
    [
      title,
      scenarioName,
      maxMembers,
      description,
      openUntil,
      location,
      pendingDates,
      scheduleMode,
      scheduledAt,
      timeLabel,
      gameSessionDescription,
    ],
    () => {
      errorMessages.value = [];
    },
    { flush: 'sync' },
  );

  const isFixedMode = computed(() => scheduleMode.value === 'fixed');

  // モードを切り替えたら、作りかけのロビーは入力内容と噛み合わなくなる
  // （候補日の無いロビーを poll モードで再利用してしまう等）。作り直させる。
  // errorMessages のクリアと同じく、切り替えの瞬間に効かせたいので flush: 'sync'
  watch(
    scheduleMode,
    () => {
      createdLobby.value = null;
    },
    { flush: 'sync' },
  );

  /** フォーム全体を検証し、エラーメッセージを全件返す（早期 return せず収集する） */
  function validate(): string[] {
    const errors: string[] = [];

    if (title.value.trim() === '') {
      errors.push('タイトルを入力してください');
    }

    const maxMembersError = getMaxMembersError(maxMembers.value);
    if (maxMembersError) {
      errors.push(maxMembersError);
    }

    if (isFixedMode.value) {
      if (scheduledAt.value === '') {
        errors.push('開催日を入力してください');
      }
    } else {
      errors.push(...getPendingTimeLabelErrors(pendingDates.value));
    }

    return errors;
  }

  /**
   * 開催日が決まっている場合の後続処理。
   * ロビーには必ずホストの LobbyEntry が作られるので、それを唯一の着席者にして開催を1件つくる。
   */
  async function createFirstGameSession(lobbyId: string): Promise<string> {
    const detail = await getLobby(lobbyId);
    const hostEntry = detail.activeEntries.find(
      (entry) => entry.userId === detail.hostUserId,
    );
    if (!hostEntry) throw new Error('ホストの参加情報が見つかりません');

    const gameSession = await createGameSession(lobbyId, {
      scheduledAt: scheduledAt.value,
      entryIds: [hostEntry.id],
      ...(timeLabel.value && { timeLabel: timeLabel.value }),
      ...(gameSessionDescription.value && {
        description: gameSessionDescription.value,
      }),
    });
    return gameSession.id;
  }

  async function submit() {
    errorMessages.value = validate();
    if (errorMessages.value.length > 0) {
      return;
    }

    loading.value = true;

    try {
      const parsedMaxMembers = parseMaxMembers(maxMembers.value);

      const lobby =
        createdLobby.value ??
        (await createLobby({
          title: title.value,
          ...(scenarioName.value && { scenarioName: scenarioName.value }),
          ...(parsedMaxMembers !== null && { maxPlayers: parsedMaxMembers }),
          ...(description.value && { description: description.value }),
          ...(openUntil.value && { openUntil: openUntil.value }),
          ...(location.value && { location: location.value }),
          candidateDates: isFixedMode.value
            ? []
            : toCandidateDateInputs(pendingDates.value),
        }));
      if (!isFixedMode.value) {
        await router.push({
          name: 'lobbies-detail',
          params: { lobbyId: lobby.id },
        });
        return;
      }

      // 開催の作成は2ステップ目なので、ここで初めて保持する意味が出る
      createdLobby.value = lobby;

      const gameSessionId = await createFirstGameSession(lobby.id);
      await router.push({
        name: 'game-sessions-detail',
        params: { lobbyId: lobby.id, gameSessionId },
      });
    } catch (err) {
      if (err instanceof ApiError) {
        errorMessages.value = [err.message];
      } else {
        console.error(err);
        errorMessages.value = ['エラーが発生しました'];
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
    scheduleMode,
    scheduledAt,
    timeLabel,
    gameSessionDescription,
    isFixedMode,
    loading,
    errorMessages,
    submit,
    cancel,
  };
};
