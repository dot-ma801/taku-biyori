import { computed, ref, toValue, watch } from 'vue';
import type { MaybeRefOrGetter } from 'vue';
import { GAME_SESSION_PLAY_MEMO_MAX_LENGTH } from '@taku-biyori/shared';
import { upsertMyPlayMemo } from '@/api/game-session';
import type { MyPlayMemoModel } from '@/models/play-memo';
import { ApiError } from '@/lib/api-client';

/**
 * 保存状態。エディタのヘッダーに常時表示する。
 *
 * - `idle`: 未編集（ドラフトがサーバ値と一致）
 * - `dirty`: 未保存の変更あり
 * - `saving`: 送信中
 * - `saved`: 保存済み
 * - `failed`: 保存に失敗（ドラフトは保持。「もう一度保存」で再試行する）
 * - `locked`: 開催が完了・中止して本文編集が閉じた（409）
 */
export type PlayMemoSaveStatus =
  | 'idle'
  | 'dirty'
  | 'saving'
  | 'saved'
  | 'failed'
  | 'locked';

/**
 * プレイメモの編集ドラフトを受け持つ composable。
 *
 * 保存は明示的な操作のみ（自動保存はしない）。未保存のまま離脱しようとしたときの
 * 警告は呼び出し側が `isDirty` を見て出す。
 *
 * ドラフト（draftBody / baseline）はこの composable が `ref()` で宣言する所有者なので、
 * 内部で `.value =` してよい（CLAUDE.md の例外）。サーバ値は所有せず getter で読む。
 */
export const usePlayMemoEdit = (
  lobbyId: string,
  gameSessionId: string,
  // NOTE: 読み取りは getter で受ける。サーバ値の所有者は useMyPlayMemo 側。
  playMemo: MaybeRefOrGetter<MyPlayMemoModel | null>,
  // NOTE: 保存後のサーバ値は callback で所有者へ返す。ここでは書き換えない。
  onSaved: (saved: MyPlayMemoModel) => void,
) => {
  /** 編集ドラフト。この composable が所有するので v-model 可 */
  const draftBody = ref('');
  /** 変更検知の基準値。サーバに保存済みの本文 */
  const baseline = ref('');
  const status = ref<PlayMemoSaveStatus>('idle');

  // 送信中かどうかは status ではなく専用のフラグで持つ。
  // status は setDraft が dirty/idle に上書きするため、二重送信ガードに使えない
  let inFlight: Promise<void> | null = null;

  const isDirty = computed(() => draftBody.value !== baseline.value);
  const length = computed(() => draftBody.value.length);
  const isOverLimit = computed(
    () => length.value > GAME_SESSION_PLAY_MEMO_MAX_LENGTH,
  );

  /**
   * サーバ値からドラフトを作り直す。
   * 本文は文字列なので代入がそのままコピーになる（deepcopy は不要）。
   */
  function reset() {
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
  // 送信中に書き足した本文が破棄されてしまう（入力が消える）。
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

  /** ドラフトを更新する */
  function setDraft(value: string) {
    // 本文が閉じたあとの入力は受け付けない（409 を繰り返さない）
    if (status.value === 'locked') return;

    draftBody.value = value;
    status.value = isDirty.value ? 'dirty' : 'idle';
  }

  /**
   * 現在のドラフトを保存する。
   *
   * 送信中・変更なし・上限超過のときは何もしない。
   * 409（開催が完了・中止した）を受けたら locked に落として編集を閉じる。
   *
   * 二重送信ガードは `status` ではなく `inFlight` を見る。`setDraft` が
   * `status` を dirty/idle に上書きするため、`status === 'saving'` は
   * 送信中に1文字でも打たれると素通りしてしまう。
   */
  async function save(): Promise<void> {
    if (inFlight) return inFlight;
    if (status.value === 'locked') return;
    if (!isDirty.value || isOverLimit.value) return;

    // 送信中に書き足された分と取り違えないよう、送った本文を控えておく
    const sending = draftBody.value;
    status.value = 'saving';

    const request = (async () => {
      try {
        const saved = await upsertMyPlayMemo(lobbyId, gameSessionId, {
          body: sending,
        });
        // 基準値は「送った本文」ではなく「サーバが保存した本文」に合わせる。
        // 上の watch はこの baseline との一致でエコーを判定するため、サーバが
        // 本文を正規化して返すと（前後の空白除去など）送信内容とはズレる。
        // 送信内容を基準にすると自分の保存をエコーと見なせず reset() が走り、
        // 送信中に書き足した本文が消える。
        baseline.value = saved.body;
        onSaved(saved);

        // 送信中に書き足されていれば未保存のまま残る。自動保存はしないので、
        // ユーザーがもう一度保存するまで dirty のままにしておく
        status.value = isDirty.value ? 'dirty' : 'saved';
      } catch (err) {
        if (err instanceof ApiError && err.status === 409) {
          // 書いている最中にホストが開催を完了・中止した。仕様どおりのエラーなので
          // リトライせず読み取りへ落とす（design-v1.2 §4）
          status.value = 'locked';
          return;
        }
        // 通信エラー。ドラフトは残し、明示的な再保存に委ねる
        status.value = 'failed';
      } finally {
        inFlight = null;
      }
    })();

    inFlight = request;
    return request;
  }

  return {
    draftBody,
    status,
    isDirty,
    length,
    isOverLimit,
    maxLength: GAME_SESSION_PLAY_MEMO_MAX_LENGTH,
    setDraft,
    save,
  };
};
