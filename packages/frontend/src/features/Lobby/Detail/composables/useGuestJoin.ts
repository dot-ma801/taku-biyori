import { computed, ref, toValue } from 'vue';
import type { MaybeRefOrGetter } from 'vue';
import { LobbyStatus } from '@taku-biyori/shared';
import type { LobbyEntryModel } from '@/models/lobby';
import { joinLobbyAsGuest } from '@/api/lobby';
import { useToast } from '@/composables/useToast';

/**
 * ゲスト（完全匿名）としてロビーに参加するための composable。
 * トークンは招待リンクのクエリ由来なので getter で受け取り、変更後の再取得は onJoined で親に委譲する。
 */
export const useGuestJoin = (
  lobbyId: string,
  // NOTE: 読み取りは getter で受ける。token は招待リンク（?token=）由来でクエリから渡る。
  token: MaybeRefOrGetter<string | null>,
  status: MaybeRefOrGetter<LobbyStatus | undefined>,
  // NOTE: 作成されたメンバーの反映（addMember 等）を呼び出し元に委譲する。
  onJoined: (member: LobbyEntryModel) => void,
) => {
  const toast = useToast();
  const loading = ref(false);

  /** ゲスト名の入力ドラフト（この composable が所有するため v-model 可） */
  const guestName = ref('');

  /** 招待トークンが付与されているか（招待リンク経由のアクセスか） */
  const hasToken = computed(() => !!toValue(token));

  /** ゲスト参加フォームを表示できるか。トークンがあり status が open のときのみ true */
  const canGuestJoin = computed(
    () => hasToken.value && toValue(status) === LobbyStatus.open,
  );

  /** ゲスト名が入力済みか。送信ボタンの活性判定に使う */
  const canSubmit = computed(() => guestName.value.trim().length > 0);

  /**
   * ゲストとしてロビーに参加する。
   * 成功後に onJoined で再取得を依頼し、入力ドラフトをリセットする。
   * トークン未設定・ゲスト名未入力・loading 中の呼び出しは無視する。
   */
  async function join() {
    if (loading.value) {
      return;
    }
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
      const member = await joinLobbyAsGuest(lobbyId, currentToken, {
        guestName: guestName.value.trim(),
      });
      onJoined(member);
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
