import { ref } from 'vue';
import { getGuestLink } from '@/api/game-session';
import { useToast } from '@/composables/useToast';

/**
 * ホストがゲスト招待リンクを取得してクリップボードにコピーするための composable。
 * トークン自体はセッションに紐づく資格情報なので、コピー時に都度取得する。
 */
export const useGuestLink = (gameSessionId: string) => {
  const toast = useToast();

  /** API 取得・コピー処理中かどうか */
  const loading = ref(false);

  /** 直近に組み立てたゲスト招待リンク（コピー成功後に保持する） */
  const guestLink = ref('');

  /** 招待リンクを組み立てる。ゲストはログインユーザーと同じ卓詳細画面を ?token 付きで開く */
  function buildLink(token: string): string {
    return `${window.location.origin}/game-sessions/${gameSessionId}?token=${token}`;
  }

  /**
   * ゲスト招待用トークンを取得し、招待リンクを組み立ててクリップボードにコピーする。
   * loading 中の重複呼び出しは無視する。
   */
  async function copyGuestLink() {
    if (loading.value) return;
    loading.value = true;
    try {
      const { token } = await getGuestLink(gameSessionId);
      const link = buildLink(token);
      guestLink.value = link;
      await navigator.clipboard.writeText(link);
      toast.success('ゲストリンクをコピーしました');
    } catch {
      toast.error('ゲストリンクの取得に失敗しました');
    } finally {
      loading.value = false;
    }
  }

  return { loading, copyGuestLink };
};
