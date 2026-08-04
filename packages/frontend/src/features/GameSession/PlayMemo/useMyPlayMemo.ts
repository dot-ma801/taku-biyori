import { computed, ref, toValue, watch } from 'vue';
import type { MaybeRefOrGetter } from 'vue';
import {
  type GameSessionDetail,
  type MyGameSessionPlayMemo,
  GameSessionAction,
  canPerform,
} from '@taku-biyori/shared';
import { getMyPlayMemo, updateMyPlayMemoVisibility } from '@/api/game-session';
import { useAuthStore } from '@/stores/auth';

/**
 * 公開切替の通信状態。
 *
 * - `idle`: 待機中
 * - `saving`: 送信中
 * - `failed`: 切替に失敗（公開状態はサーバ値のまま変わらない）
 */
export type PlayMemoVisibilityStatus = 'idle' | 'saving' | 'failed';

/**
 * 自分のプレイメモを取得し、書ける相手かどうかを判定する composable。
 *
 * サーバ値（playMemo）の所有者はこの composable 自身なので、内部で `.value =` してよい。
 * 編集ドラフトは持たない（ドラフトの所有者は編集 UI 側。CLAUDE.md「サーバ値と編集ドラフトは別物」）。
 */
export const useMyPlayMemo = (
  gameSessionId: string,
  // NOTE: 読み取りは getter で受ける。Ref を要求すると props 境界をまたいで
  //       書き換え可能になり、依存の向き（親→子）が壊れるため。
  gameSession: MaybeRefOrGetter<GameSessionDetail | null>,
) => {
  const authStore = useAuthStore();
  const playMemo = ref<MyGameSessionPlayMemo | null>(null);
  const loading = ref(false);

  /**
   * 自分のメンバー行。
   *
   * ゲストは `userId = null` で登録されるため、認証ユーザー ID での検索には
   * 構造上ヒットしない。「ログイン済み」「その卓のメンバー」「ゲストでない」の
   * 3条件がこの1つの検索で同時に満たされる（design-v1.2 §4）。
   */
  const myMember = computed(() => {
    const userId = authStore.currentUser?.id;
    if (!userId) return undefined;
    return toValue(gameSession)?.members.find((m) => m.userId === userId);
  });

  /** メモ機能の対象者か（ログイン済みかつその卓のメンバー） */
  const isMyMemo = computed(() => !!myMember.value);

  /** ログイン導線を出すか。未ログインとゲストは同じ枝に落ちる */
  const showLoginPrompt = computed(() => !authStore.isAuthenticated);

  const isHost = computed(
    () => toValue(gameSession)?.createdBy === authStore.currentUser?.id,
  );

  /**
   * 本文を編集できるか。
   *
   * 判定は shared の ACTION_POLICIES に委ね、バックエンドの 409 と同じ表を使う
   * （完了・中止で false になる）。公開・非公開の切り替えはこの判定に依存しない。
   */
  const canEditBody = computed(() => {
    const status = toValue(gameSession)?.status;
    if (!isMyMemo.value || status === undefined) return false;
    return canPerform(
      GameSessionAction.editPlayMemo,
      status,
      isHost.value ? 'host' : 'member',
    );
  });

  /**
   * 自分のメモを取得する。
   *
   * 卓詳細は requiresAuth ではなくルートガードがセッション復元を待たないため、
   * 判定の前に復元の完了を待つ（待たないとマウント直後は常に非メンバー扱いになる）。
   * 非メンバーには通信しない（403 を出し続けないため）。
   */
  async function fetch() {
    // 通信を始める前から loading を立てる。ensureSessionReady() の後に立てると、
    // 「卓が届いた直後・まだ通信を始めていない」区間で loading === false かつ
    // playMemo === null になる窓ができ、PlayMemoView の loadFailed（読み込み
    // 失敗 UI）が通信前から誤表示され得る。
    loading.value = true;
    try {
      await authStore.ensureSessionReady();

      if (!isMyMemo.value) {
        playMemo.value = null;
        return;
      }

      playMemo.value = await getMyPlayMemo(gameSessionId);
    } catch {
      // 退出直後の 403 や通信エラー。トーストは出さずセクションを閉じる
      // （メモは卓詳細の主目的ではないため、失敗を前面に出さない）
      playMemo.value = null;
    } finally {
      loading.value = false;
    }
  }

  /** 保存後のサーバ値を反映する。playMemo の所有者はこの composable */
  function applySaved(saved: MyGameSessionPlayMemo) {
    playMemo.value = saved;
  }

  // ---------- 公開・非公開の切替 ----------

  /** 公開中か。サーバ値（shared_at の有無）から導く */
  const isShared = computed(() => !!playMemo.value?.sharedAt);

  /**
   * 公開・非公開を切り替えられるか。
   *
   * 本文の編集可否（canEditBody）とは独立で、完了・中止した卓でも切り替えられる
   * （design-v1.2 §4）。ただし本文を一度も保存していないメモは API が 404 を
   * 返すため、`updatedAt` が null の間は切り替えさせない。
   */
  const canToggleVisibility = computed(
    () => !!playMemo.value && playMemo.value.updatedAt !== null,
  );

  const visibilityStatus = ref<PlayMemoVisibilityStatus>('idle');

  // 二重送信のガード。連打で公開・非公開が競合しないよう、送信中は後続を捨てる
  let visibilityInFlight = false;

  /**
   * 公開・非公開を切り替える。
   *
   * 楽観的更新はしない。誤公開の事故を避けるため、表示はサーバが返した
   * `shared_at` に従わせる（要求 §4）。
   */
  async function setShared(shared: boolean): Promise<void> {
    if (visibilityInFlight) return;
    if (!canToggleVisibility.value) return;

    visibilityInFlight = true;
    visibilityStatus.value = 'saving';

    try {
      playMemo.value = await updateMyPlayMemoVisibility(gameSessionId, {
        shared,
      });
      visibilityStatus.value = 'idle';
    } catch {
      // 通信エラー・退出直後の 403 など。状態は変えずに失敗だけを伝える
      visibilityStatus.value = 'failed';
    } finally {
      visibilityInFlight = false;
    }
  }

  // 「自分がメモを持てる相手になったか（isMyMemo）」を監視して取得する。
  // 卓詳細（マウント時には取得済み）とメモ画面（後から届く）のどちらの
  // 順序でも動くよう、値の到着を watch で待つ。
  //
  // 「卓が届いたか」ではなく isMyMemo を監視するのがポイント。卓詳細で
  // 「参加する」を実行した直後は gameSession はすでに届いているため、
  // gameSession の到着だけを監視すると再取得のトリガーがない。isMyMemo は
  // 参加で members が更新されて非メンバー→メンバーに変わったときに
  // true になるので、そのタイミングで再取得できる。
  // watch は値が実際に変化したときだけ発火するため、isMyMemo が true の
  // まま卓が再取得されても余計な二重取得は起きない（明示的な抑制フラグは不要）。
  watch(
    isMyMemo,
    (isMine) => {
      if (!isMine) return;
      void fetch();
    },
    { immediate: true },
  );

  return {
    playMemo,
    loading,
    myMember,
    isMyMemo,
    showLoginPrompt,
    canEditBody,
    isShared,
    canToggleVisibility,
    visibilityStatus,
    setShared,
    fetch,
    applySaved,
  };
};
