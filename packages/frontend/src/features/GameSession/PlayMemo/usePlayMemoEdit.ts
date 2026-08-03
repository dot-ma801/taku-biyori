import { computed, onUnmounted, ref, toValue, watch } from 'vue';
import type { MaybeRefOrGetter } from 'vue';
import {
  type MyGameSessionPlayMemo,
  GAME_SESSION_PLAY_MEMO_MAX_LENGTH,
} from '@taku-biyori/shared';
import { upsertMyPlayMemo } from '@/api/game-session';
import { ApiError } from '@/lib/api-client';

/** 自動保存までの待ち時間（ミリ秒）。手が止まってから送る */
export const AUTOSAVE_DELAY_MS = 3000;

/**
 * 保存状態。エディタのヘッダーに常時表示する。
 *
 * - `idle`: 未編集（ドラフトがサーバ値と一致）
 * - `dirty`: 未保存の変更あり（デバウンス待ち）
 * - `saving`: 送信中
 * - `saved`: 保存済み
 * - `failed`: 保存に失敗（ドラフトは保持。入力の再開か「もう一度保存」で再試行する）
 * - `locked`: 卓が完了・中止して本文編集が閉じた（409）
 */
export type PlayMemoSaveStatus =
  | 'idle'
  | 'dirty'
  | 'saving'
  | 'saved'
  | 'failed'
  | 'locked';

/**
 * プレイメモの編集ドラフトと自動保存を受け持つ composable。
 *
 * 3〜4時間書き続ける前提のため、保存の主役はボタンではなくデバウンス自動保存。
 * ドラフト（draftBody / baseline）はこの composable が `ref()` で宣言する所有者なので、
 * 内部で `.value =` してよい（CLAUDE.md の例外）。サーバ値は所有せず getter で読む。
 */
export const usePlayMemoEdit = (
  gameSessionId: string,
  // NOTE: 読み取りは getter で受ける。サーバ値の所有者は useMyPlayMemo 側。
  playMemo: MaybeRefOrGetter<MyGameSessionPlayMemo | null>,
  // NOTE: 保存後のサーバ値は callback で所有者へ返す。ここでは書き換えない。
  onSaved: (saved: MyGameSessionPlayMemo) => void,
) => {
  /** 編集ドラフト。この composable が所有するので v-model 可 */
  const draftBody = ref('');
  /** 変更検知の基準値。サーバに保存済みの本文 */
  const baseline = ref('');
  const status = ref<PlayMemoSaveStatus>('idle');

  let timer: ReturnType<typeof setTimeout> | null = null;
  // 送信中かどうかは status ではなく専用のフラグで持つ。
  // status は setDraft が dirty/idle に上書きするため、二重送信ガードに使えない
  let inFlight: Promise<void> | null = null;

  const isDirty = computed(() => draftBody.value !== baseline.value);
  const length = computed(() => draftBody.value.length);
  const isOverLimit = computed(
    () => length.value > GAME_SESSION_PLAY_MEMO_MAX_LENGTH,
  );

  function cancelTimer() {
    if (timer === null) return;
    clearTimeout(timer);
    timer = null;
  }

  /**
   * サーバ値からドラフトを作り直す。
   * 本文は文字列なので代入がそのままコピーになる（deepcopy は不要）。
   */
  function reset() {
    cancelTimer();
    const body = toValue(playMemo)?.body ?? '';
    baseline.value = body;
    draftBody.value = body;
    status.value = 'idle';
  }

  // 再取得でサーバ値が差し替わるとドラフトが古いまま取り残されるため作り直す
  // （CLAUDE.md「罠」）。初回のサーバ値到着もこの watch が拾う。
  //
  // ただし自分が save() した結果が onSaved 経由で反映される「エコー」では
  // 作り直してはいけない。save() 成功 → onSaved → 親が playMemo を差し替え →
  // この watch が発火、という環になっているため、無条件に reset() すると
  // 送信中に書き足した本文とタイマーが破棄されてしまう（入力が消える）。
  // 届いたサーバ値の body が baseline と一致する＝自分の保存の反映なので、
  // その場合だけ reset をスキップする。
  watch(
    () => toValue(playMemo),
    (memo) => {
      if ((memo?.body ?? '') === baseline.value) return;
      reset();
    },
    { immediate: true },
  );

  function scheduleAutoSave() {
    cancelTimer();
    if (!isDirty.value || isOverLimit.value) return;
    timer = setTimeout(() => {
      void save();
    }, AUTOSAVE_DELAY_MS);
  }

  /** ドラフトを更新し、自動保存のタイマーを引き直す */
  function setDraft(value: string) {
    // 本文が閉じたあとの入力は受け付けない（409 を繰り返さない）
    if (status.value === 'locked') return;

    draftBody.value = value;
    status.value = isDirty.value ? 'dirty' : 'idle';
    scheduleAutoSave();
  }

  /**
   * 現在のドラフトを保存する。
   *
   * 送信中・変更なし・上限超過のときは何もしない。
   * 409（卓が完了・中止した）を受けたら locked に落として編集を閉じる。
   *
   * 二重送信ガードは `status` ではなく `inFlight` を見る。`setDraft` が
   * `status` を dirty/idle に上書きするため、`status === 'saving'` は
   * 送信中に1文字でも打たれると素通りしてしまう（応答が遅いと PUT が2本飛ぶ）。
   */
  async function save(): Promise<void> {
    if (inFlight) return inFlight;
    if (status.value === 'locked') return;
    if (!isDirty.value || isOverLimit.value) return;

    cancelTimer();
    // 送信中に書き足された分と取り違えないよう、送った本文を控えておく
    const sending = draftBody.value;
    status.value = 'saving';

    const request = (async () => {
      try {
        const saved = await upsertMyPlayMemo(gameSessionId, { body: sending });
        baseline.value = sending;
        onSaved(saved);

        if (isDirty.value) {
          // 送信中に書き足されていた。続きをもう一度予約する
          status.value = 'dirty';
          scheduleAutoSave();
        } else {
          status.value = 'saved';
        }
      } catch (err) {
        if (err instanceof ApiError && err.status === 409) {
          // 書いている最中にホストが卓を完了・中止した。仕様どおりのエラーなので
          // リトライせず読み取りへ落とす（design-v1.2 §4）
          status.value = 'locked';
          return;
        }
        // 通信エラー。ドラフトは残し、予約中の自動保存だけ落とす。
        // 入力が再開されれば scheduleAutoSave がやり直すので、復帰は自然に起きる
        status.value = 'failed';
      } finally {
        inFlight = null;
      }
    })();

    inFlight = request;
    return request;
  }

  /**
   * 離脱前に未保存を送り切る。離脱してよいかを返す。
   *
   * 自動保存がある画面で毎回確認ダイアログを出すのは筋が悪いため、
   * まず保存を試み、失敗したときだけ呼び出し側に確認を委ねる。
   */
  async function flush(): Promise<boolean> {
    cancelTimer();
    // 進行中の自動保存を待ってから判定する。待たないと、送信中は baseline が
    // まだ更新されておらず isDirty が true のままなので、成功見込みでも
    // 必ず離脱確認が出てしまう（design-v1.2 §8「まず保存を試み、失敗した
    // ときだけ確認する」に反する）。
    if (inFlight) await inFlight;
    if (!isDirty.value) return true;
    if (isOverLimit.value) return false;

    await save();
    return !isDirty.value || status.value === 'locked';
  }

  onUnmounted(cancelTimer);

  return {
    draftBody,
    status,
    isDirty,
    length,
    isOverLimit,
    maxLength: GAME_SESSION_PLAY_MEMO_MAX_LENGTH,
    setDraft,
    save,
    flush,
  };
};
