import { computed, ref, toValue } from 'vue';
import type { MaybeRefOrGetter } from 'vue';
import { GameSessionStatus } from '@taku-biyori/shared';
import { getGuestLink } from '@/api/game-session';
import { useAuthStore } from '@/stores/auth';
import { useToast } from '@/composables/useToast';

/**
 * ホストがゲスト招待リンクを取得してクリップボードにコピーするための composable。
 * トークン取得 API はホスト限定（非ホストは 403）なので、発行可否もホストで判定する。
 * トークン自体はセッションに紐づく資格情報なので、コピー時に都度取得する。
 * 読み取りは getter で受け取り、依存の向き（親→子）を一方向に保つ。
 */
export const useGuestLink = (
  gameSessionId: string,
  createdBy: MaybeRefOrGetter<string>,
  status: MaybeRefOrGetter<GameSessionStatus | undefined>,
) => {
  const authStore = useAuthStore();
  const toast = useToast();

  /** API 取得・コピー処理中かどうか */
  const loading = ref(false);

  /** 直近に組み立てたゲスト招待リンク（コピー成功後に保持する） */
  const guestLink = ref('');

  /** ログインユーザーがこのセッションのホストか */
  const isHost = computed(
    () =>
      !!authStore.currentUser &&
      toValue(createdBy) === authStore.currentUser.id,
  );

  /**
   * ゲスト招待リンクを発行できるか。ボタンの出し分けに使う。
   * トークン取得 API がホスト限定のため、ホストかつ status が open（募集中）のときのみ true。
   */
  const canIssueGuestLink = computed(
    () => isHost.value && toValue(status) === GameSessionStatus.open,
  );

  /** 招待リンクを組み立てる。ゲストはログインユーザーと同じ卓詳細画面を ?token 付きで開く */
  function buildLink(token: string): string {
    return `${window.location.origin}/game-sessions/${gameSessionId}?token=${token}`;
  }

  /**
   * ゲスト招待用トークンを取得し、招待リンクを組み立ててクリップボードにコピーする。
   * 発行条件を満たさない場合・loading 中の重複呼び出しは無視する。
   */
  async function copyGuestLink() {
    if (loading.value || !canIssueGuestLink.value) return;
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

  return { loading, canIssueGuestLink, copyGuestLink };
};
