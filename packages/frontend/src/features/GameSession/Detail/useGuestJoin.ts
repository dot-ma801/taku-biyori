import { computed, ref, toValue } from 'vue';
import type { MaybeRefOrGetter } from 'vue';
import { GameSessionStatus } from '@taku-biyori/shared';
import { joinAsGuest } from '@/api/game-session';
import { useToast } from '@/composables/useToast';

/**
 * ゲスト（完全匿名）として卓に参加するための composable。
 * トークンは招待リンクのクエリ由来なので getter で受け取り、変更後の再取得は onJoined で親に委譲する。
 */
export const useGuestJoin = (
  gameSessionId: string,
  // NOTE: 読み取りは getter で受ける。token は招待リンク（?token=）由来でクエリから渡る。
  token: MaybeRefOrGetter<string | null>,
  status: MaybeRefOrGetter<GameSessionStatus | undefined>,
  // NOTE: 参加成功後の再取得を呼び出し元に委譲する。
  onJoined: () => void,
) => {
  const toast = useToast();
  const loading = ref(false);

  /** ゲスト名の入力ドラフト（この composable が所有するため v-model 可） */
  const guestName = ref('');

  /** 招待トークンが付与されているか（招待リンク経由のアクセスか） */
  const hasToken = computed(() => !!toValue(token));

  /** ゲスト参加フォームを表示できるか。トークンがあり status が open のときのみ true */
  const canGuestJoin = computed(
    () => hasToken.value && toValue(status) === GameSessionStatus.open,
  );

  /** ゲスト名が入力済みか。送信ボタンの活性判定に使う */
  const canSubmit = computed(() => guestName.value.trim().length > 0);

  /**
   * ゲストとして卓に参加する。
   * 成功後に onJoined で再取得を依頼し、入力ドラフトをリセットする。
   * トークン未設定・ゲスト名未入力・loading 中の呼び出しは無視する。
   */
  async function join() {
    if (loading.value) return;
    const currentToken = toValue(token);
    if (!currentToken) {
      toast.error('招待用リンクからのみ参加が可能です');
      return;
    }
    if (!canSubmit.value) {
      toast.error('ゲストユーザ名を入力してください');
      return;
    }
    loading.value = true;
    try {
      await joinAsGuest(gameSessionId, currentToken, {
        guestName: guestName.value.trim(),
      });
      onJoined();
      guestName.value = '';
      toast.success('参加しました');
    } catch {
      toast.error('参加に失敗しました');
    } finally {
      loading.value = false;
    }
  }

  return {
    guestName,
    hasToken,
    canGuestJoin,
    canSubmit,
    loading,
    join,
  };
};
