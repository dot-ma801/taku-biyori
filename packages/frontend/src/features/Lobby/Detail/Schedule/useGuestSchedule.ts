import { computed, ref, toValue } from 'vue';
import type { MaybeRefOrGetter } from 'vue';
import {
  LobbyAction,
  LobbyStatus,
  canPerformLobbyAction,
} from '@taku-biyori/shared';
import type { ScheduleAnswerItem } from '@taku-biyori/shared';
import { upsertGuestScheduleAnswers } from '@/api/lobby';
import { ApiError } from '@/lib/api-client';
import { useToast } from '@/composables/useToast';
import type {
  CandidateDateModel,
  ScheduleAnswerValue,
} from '@/models/schedule-poll';

const CYCLE: Record<ScheduleAnswerValue, ScheduleAnswerValue> = {
  ok: 'maybe',
  maybe: 'ng',
  ng: 'ok',
};

const STALE_POLL_MESSAGE =
  '新しい日程調整が始まっています。最新の状態を読み込み直してください';

/** 編集ドラフト1件。どのゲスト列・どの候補日を何に変えるかを保持する */
interface DraftAnswer {
  entryId: string;
  candidateDateId: string;
  answer: ScheduleAnswerValue;
}

/**
 * ゲスト（完全匿名・本人確認なし）が全ゲスト列の日程回答を編集するための composable。
 * 調整さん方式で、entryId を指定して任意のゲスト列を更新できる
 * （「トークンさえ持っていればどのゲスト列でも編集できる」現行の挙動は変えない）。
 * サーバ値（candidateDates）は親が所有し getter で受け取る。書き込みは onUpdated で親へ委譲する。
 */
export const useGuestSchedule = (
  lobbyId: string,
  // NOTE: token は招待リンク（?token=）由来。読み取りは getter で受ける。
  token: MaybeRefOrGetter<string | null>,
  // 送信対象の日程調整 id（親が持つ最新の調整。schedulePolls[0]?.id ?? null）
  pollId: MaybeRefOrGetter<string | null>,
  candidateDates: MaybeRefOrGetter<CandidateDateModel[]>,
  status: MaybeRefOrGetter<LobbyStatus | undefined>,
  // サーバが SSOT。更新成功後に所有者へ「再取得」を依頼する（クライアント側で状態を組み立てない）。
  onUpdated: () => void | Promise<void>,
  // 送信時に 409（この調整が最新でなくなった）を受けたとき、親にロビー詳細の
  // 再取得を依頼するコールバック。このときは onUpdated を呼ばない
  // （親の latestPollId 自体が古く、正しい調整を再取得できないため）。
  onStale: () => void,
) => {
  const toast = useToast();
  /** API 送信中かどうか */
  const loading = ref(false);
  /** 編集モード中かどうか */
  const isEditing = ref(false);
  /** 直近の操作で発生したエラーメッセージ（409 のときのみ設定する） */
  const errorMessage = ref('');

  /**
   * 編集ドラフト（`${entryId}::${candidateDateId}` → 回答）。
   * サーバ値とは分離して保持し、変更検知・キャンセルを成立させる。
   * この ref はこの composable が所有する。
   */
  const draftAnswers = ref<Map<string, DraftAnswer>>(new Map());

  function keyOf(entryId: string, candidateDateId: string): string {
    return `${entryId}::${candidateDateId}`;
  }

  /**
   * 表示用ドラフト。`${entryId}::${candidateDateId}` → 回答。
   * ScheduleTable に渡して編集中セルの描画に使う（メンバー編集と同じキー形式に揃える）。
   */
  const draftAnswerMap = computed<Map<string, ScheduleAnswerValue>>(() => {
    const map = new Map<string, ScheduleAnswerValue>();
    for (const {
      entryId,
      candidateDateId,
      answer,
    } of draftAnswers.value.values()) {
      map.set(keyOf(entryId, candidateDateId), answer);
    }
    return map;
  });

  /** 招待トークンが付与されているか */
  const hasToken = computed(() => !!toValue(token));

  /** ゲストが日程回答を編集できるか。トークンがあり公開済み（open / closed）のときのみ true */
  const canEditGuestSchedule = computed(() => {
    const s = toValue(status);
    return (
      hasToken.value &&
      s !== undefined &&
      canPerformLobbyAction(LobbyAction.answerSchedule, s, 'guest')
    );
  });

  /** サーバ値における指定ゲスト列・候補日の回答（なければ null） */
  function originalAnswerOf(
    entryId: string,
    candidateDateId: string,
  ): ScheduleAnswerValue | null {
    const date = toValue(candidateDates).find((d) => d.id === candidateDateId);
    return date?.answersByEntryId.get(entryId)?.answer ?? null;
  }

  /** 現在の回答（ドラフトを優先し、なければサーバ値） */
  function currentAnswerOf(
    entryId: string,
    candidateDateId: string,
  ): ScheduleAnswerValue | null {
    return (
      draftAnswers.value.get(keyOf(entryId, candidateDateId))?.answer ??
      originalAnswerOf(entryId, candidateDateId)
    );
  }

  /** いずれかのドラフトがサーバ値と異なるか */
  const hasChanges = computed(() => {
    for (const {
      entryId,
      candidateDateId,
      answer,
    } of draftAnswers.value.values()) {
      if (originalAnswerOf(entryId, candidateDateId) !== answer) return true;
    }
    return false;
  });

  /** 編集モードを開始する。ドラフトは空から始め、操作したセルだけ記録する */
  function enterEditMode() {
    draftAnswers.value = new Map();
    isEditing.value = true;
  }

  /** 編集をキャンセルしてドラフトを破棄する */
  function cancelEdit() {
    draftAnswers.value = new Map();
    isEditing.value = false;
  }

  /** 指定セルの回答を ok → maybe → ng → ok の順に循環させる（未回答は ok から） */
  function cycleAnswer(entryId: string, candidateDateId: string) {
    const cur = currentAnswerOf(entryId, candidateDateId);
    draftAnswers.value.set(keyOf(entryId, candidateDateId), {
      entryId,
      candidateDateId,
      answer: cur ? CYCLE[cur] : 'ok',
    });
  }

  /**
   * サーバ値と異なるドラフトを、変更のあった entryId ごとに1リクエストへまとめて送信する
   * （新 API は body の entryId で対象列を指定するため、entryId ごとに1リクエスト）。
   *
   * 409（誰かが新しい調整を始め、この調整が最新でなくなった）を受けたときは
   * errorMessage を設定し `onStale` を呼ぶだけで、onUpdated は呼ばない
   * （親が持つ latestPollId 自体が古く、正しい調整を再取得できないため）。
   * それ以外の失敗は error トーストを出したうえで、途中失敗による半 commit を
   * 避けるため onUpdated を呼んで親状態を再同期させる。
   *
   * トークン未設定・調整未設定・変更なし・loading 中の呼び出しは無視する。
   */
  async function submitEdit() {
    if (loading.value) return;
    const currentToken = toValue(token);
    if (!currentToken) return;
    const currentPollId = toValue(pollId);
    if (!currentPollId) return;

    const changes = [...draftAnswers.value.values()].filter(
      ({ entryId, candidateDateId, answer }) =>
        originalAnswerOf(entryId, candidateDateId) !== answer,
    );
    if (changes.length === 0) {
      draftAnswers.value = new Map();
      isEditing.value = false;
      return;
    }

    const changesByEntryId = new Map<string, ScheduleAnswerItem[]>();
    for (const { entryId, candidateDateId, answer } of changes) {
      const list = changesByEntryId.get(entryId) ?? [];
      list.push({ candidateDateId, answer });
      changesByEntryId.set(entryId, list);
    }

    loading.value = true;
    errorMessage.value = '';
    try {
      const results = await Promise.allSettled(
        [...changesByEntryId.entries()].map(([entryId, answers]) =>
          upsertGuestScheduleAnswers(lobbyId, currentPollId, currentToken, {
            entryId,
            answers,
          }),
        ),
      );

      const staleFailure = results.find(
        (r): r is PromiseRejectedResult =>
          r.status === 'rejected' &&
          r.reason instanceof ApiError &&
          r.reason.status === 409,
      );
      if (staleFailure) {
        errorMessage.value = STALE_POLL_MESSAGE;
        draftAnswers.value = new Map();
        isEditing.value = false;
        onStale();
        return;
      }

      const failed = results.filter((r) => r.status === 'rejected');
      if (failed.length > 0) {
        for (const r of failed) {
          if (r.status === 'rejected') {
            console.error('日程回答の更新に失敗しました', r.reason);
          }
        }
        toast.error('日程回答の更新に失敗しました');
      }

      // 成否によらず親状態を再同期して半 commit 状態を解消する
      await onUpdated();
      draftAnswers.value = new Map();
      isEditing.value = false;
    } catch {
      toast.error('日程回答の更新に失敗しました');
    } finally {
      loading.value = false;
    }
  }

  return {
    loading,
    isEditing,
    errorMessage,
    hasToken,
    canEditGuestSchedule,
    hasChanges,
    draftAnswers: draftAnswerMap,
    currentAnswerOf,
    cycleAnswer,
    enterEditMode,
    cancelEdit,
    submitEdit,
  };
};
