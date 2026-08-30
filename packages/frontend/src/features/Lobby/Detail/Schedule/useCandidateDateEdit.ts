import { computed, ref, toValue } from 'vue';
import type { MaybeRefOrGetter } from 'vue';
import {
  LobbyAction,
  LobbyStatus,
  canPerformLobbyAction,
} from '@taku-biyori/shared';
import { replaceCandidateDates } from '@/api/lobby';
import { ApiError } from '@/lib/api-client';
import { useAuthStore } from '@/stores/auth';
import type { CandidateDateModel } from '@/models/schedule-poll';
import type { PendingCandidateDate } from '@/utils/pendingCandidateDates';
import {
  getPendingTimeLabelErrors,
  toCandidateDateInputs,
} from '@/utils/pendingCandidateDates';

const STALE_POLL_MESSAGE =
  '新しい日程調整が始まっています。最新の状態を読み込み直してください';

const PAST_DATE_ADDED_MESSAGE =
  '現在の調整に含まれていない過去日を追加することはできません';

/**
 * ホストが最新の日程調整の候補日を編集する（`replaceCandidateDates` を呼ぶ）ための composable。
 *
 * サーバ値（`candidateDates`）は親（useSchedulePoll）が所有し getter で受け取る。
 * 編集ドラフト（`pendingDates`）はこの composable が所有し、`enterEditMode` で
 * サーバ値からコピーして作る（CLAUDE.md「サーバ値と編集ドラフトを同一の状態にしない」）。
 *
 * 成功時は `onUpdated` で親（useSchedulePoll）に候補日の再取得を依頼する。
 * 409（最新の調整でなくなった）を受けたときは `onStale` で親（ロビー詳細）に
 * 再取得を依頼し、`onUpdated` は呼ばない（親が持つ pollId 自体が古いため）。
 * 400（現在の調整に無い過去日を追加した）は既存の過去日の据え置き・timeLabel の
 * 変更とは区別される backend の契約なので、専用の文言で伝える。
 */
export const useCandidateDateEdit = (
  lobbyId: string,
  pollId: MaybeRefOrGetter<string | null>,
  hostUserId: MaybeRefOrGetter<string>,
  status: MaybeRefOrGetter<LobbyStatus | undefined>,
  candidateDates: MaybeRefOrGetter<CandidateDateModel[]>,
  onUpdated: () => void | Promise<void>,
  onStale: () => void,
) => {
  const authStore = useAuthStore();

  /** ログインユーザーがこの募集枠のホストか */
  const isHost = computed(
    () =>
      !!authStore.currentUser &&
      toValue(hostUserId) === authStore.currentUser.id,
  );

  /** 「候補日を編集」ボタンを表示できるか。ホストかつ shared のポリシーを満たすときのみ true */
  const canEditCandidateDates = computed(() => {
    const s = toValue(status);
    return (
      isHost.value &&
      s !== undefined &&
      canPerformLobbyAction(LobbyAction.editCandidateDates, s, 'host')
    );
  });

  /** 編集モード中かどうか */
  const isEditing = ref(false);
  /** 編集ドラフト。この composable が所有する */
  const pendingDates = ref<PendingCandidateDate[]>([]);
  /** API 送信中かどうか */
  const loading = ref(false);
  /** バリデーション・API エラーのメッセージ一覧 */
  const errorMessages = ref<string[]>([]);

  /** 編集モードを開始する。サーバ値（candidateDates）をコピーしてドラフトを初期化する */
  function enterEditMode() {
    pendingDates.value = toValue(candidateDates).map((date) => ({
      date: date.date,
      timeLabel: date.timeLabel ?? '',
    }));
    errorMessages.value = [];
    isEditing.value = true;
  }

  /** 編集をキャンセルしてドラフトを破棄する */
  function cancelEdit() {
    isEditing.value = false;
    pendingDates.value = [];
    errorMessages.value = [];
  }

  /** 送信前のクライアント側バリデーション（早期 return せず収集する） */
  function validate(): string[] {
    const errors: string[] = [];

    if (pendingDates.value.length === 0) {
      errors.push('候補日を1件以上指定してください');
    }

    errors.push(...getPendingTimeLabelErrors(pendingDates.value));

    return errors;
  }

  /**
   * 「保存する」：バリデーションを通ったら候補日を一括で差し替える。
   * 過去日ルール（既存の過去日の据え置き・timeLabel の変更は可）は backend が判定するため、
   * ここでは過去日を弾かない。
   * pollId が無い・canEditCandidateDates が false・loading 中の重複呼び出しは無視する。
   */
  async function submitEdit() {
    const currentPollId = toValue(pollId);
    if (loading.value || !canEditCandidateDates.value || !currentPollId) {
      return;
    }

    errorMessages.value = validate();
    if (errorMessages.value.length > 0) {
      return;
    }

    loading.value = true;
    try {
      await replaceCandidateDates(lobbyId, currentPollId, {
        candidateDates: toCandidateDateInputs(pendingDates.value),
      });
      isEditing.value = false;
      pendingDates.value = [];
      await onUpdated();
    } catch (err) {
      if (err instanceof ApiError && err.status === 409) {
        errorMessages.value = [STALE_POLL_MESSAGE];
        isEditing.value = false;
        pendingDates.value = [];
        onStale();
        return;
      }
      if (err instanceof ApiError && err.status === 400) {
        errorMessages.value = [PAST_DATE_ADDED_MESSAGE];
        return;
      }
      errorMessages.value = [
        err instanceof ApiError ? err.message : '候補日の更新に失敗しました',
      ];
    } finally {
      loading.value = false;
    }
  }

  return {
    canEditCandidateDates,
    isEditing,
    pendingDates,
    loading,
    errorMessages,
    enterEditMode,
    cancelEdit,
    submitEdit,
  };
};
