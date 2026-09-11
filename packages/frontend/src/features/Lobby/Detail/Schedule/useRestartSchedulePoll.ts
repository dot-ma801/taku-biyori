import { computed, ref, toValue } from 'vue';
import type { MaybeRefOrGetter } from 'vue';
import {
  LobbyAction,
  LobbyStatus,
  canPerformLobbyAction,
  todayDateString,
} from '@taku-biyori/shared';
import { createSchedulePoll } from '@/api/lobby';
import { ApiError } from '@/lib/api-client';
import { useAuthStore } from '@/stores/auth';
import type { PendingCandidateDate } from '@/utils/pendingCandidateDates';
import {
  getPendingTimeLabelErrors,
  toCandidateDateInputs,
} from '@/utils/pendingCandidateDates';

/**
 * ホストが「日程調整をやり直す」（新しい SchedulePoll を開始する）ための composable。
 *
 * 現在の調整は読み取り専用の履歴になる不可逆な操作なので、実行前に確認を挟む
 * （`isConfirming` で「やり直す」ボタン → 確認文＋候補日入力＋実行/やめるの2段階を表す。
 * 確認用のダイアログコンポーネントは無いため .vue 側でインラインに出す）。
 *
 * サーバ値（親が持つ lobby.hostUserId / status）は getter で受け取り、成功時は
 * `onCreated` で親へ再取得を依頼する（schedulePolls が変わらないと最新の調整 id が
 * 切り替わらないため、この composable 自身は再取得しない）。
 */
export const useRestartSchedulePoll = (
  lobbyId: string,
  hostUserId: MaybeRefOrGetter<string>,
  status: MaybeRefOrGetter<LobbyStatus | undefined>,
  onCreated: () => void,
) => {
  const authStore = useAuthStore();

  /** ログインユーザーがこのロビーのホストか */
  const isHost = computed(
    () =>
      !!authStore.currentUser &&
      toValue(hostUserId) === authStore.currentUser.id,
  );

  /** 「やり直す」ボタンを表示できるか。ホストかつ shared のポリシーを満たすときのみ true */
  const canRestart = computed(() => {
    const s = toValue(status);
    return (
      isHost.value &&
      s !== undefined &&
      canPerformLobbyAction(LobbyAction.startSchedulePoll, s, 'host')
    );
  });

  /** 確認＋候補日入力パネルを開いているか */
  const isConfirming = ref(false);
  /** 新しい調整の候補日入力（この composable が所有する。原本＝サーバ値は存在しない） */
  const pendingDates = ref<PendingCandidateDate[]>([]);
  /** API 送信中かどうか */
  const loading = ref(false);
  /** バリデーション・API エラーのメッセージ一覧 */
  const errorMessages = ref<string[]>([]);

  /** 「やり直す」を押して確認パネルを開く */
  function start() {
    pendingDates.value = [];
    errorMessages.value = [];
    isConfirming.value = true;
  }

  /** 「やめる」で確認パネルを閉じ、入力を破棄する */
  function cancel() {
    isConfirming.value = false;
    pendingDates.value = [];
    errorMessages.value = [];
  }

  /**
   * 送信前のクライアント側バリデーション（早期 return せず収集する）。
   * 過去日は backend（CreateSchedulePollInputSchema）も 400 で弾くが、
   * ここでも同じ基準で先に弾いて余計な通信を避ける。
   */
  function validate(): string[] {
    const errors: string[] = [];

    if (pendingDates.value.length === 0) {
      errors.push('候補日を1件以上指定してください');
    }

    const today = todayDateString();
    const hasPastDate = pendingDates.value.some((d) => d.date < today);
    if (hasPastDate) {
      errors.push('候補日には今日以降の日付を指定してください');
    }

    errors.push(...getPendingTimeLabelErrors(pendingDates.value));

    return errors;
  }

  /**
   * 「実行する」：バリデーションを通ったら新しい調整を作成する。
   * 成功後は確認パネルを閉じ、`onCreated` で親にロビー詳細の再取得を依頼する。
   * canRestart が false・loading 中の重複呼び出しは無視する。
   */
  async function confirmRestart() {
    if (loading.value || !canRestart.value) {
      return;
    }

    errorMessages.value = validate();
    if (errorMessages.value.length > 0) {
      return;
    }

    loading.value = true;
    try {
      await createSchedulePoll(lobbyId, {
        candidateDates: toCandidateDateInputs(pendingDates.value),
      });
      isConfirming.value = false;
      pendingDates.value = [];
      onCreated();
    } catch (err) {
      errorMessages.value = [
        err instanceof ApiError ? err.message : '日程調整の作成に失敗しました',
      ];
    } finally {
      loading.value = false;
    }
  }

  return {
    canRestart,
    isConfirming,
    pendingDates,
    loading,
    errorMessages,
    start,
    cancel,
    confirmRestart,
  };
};
