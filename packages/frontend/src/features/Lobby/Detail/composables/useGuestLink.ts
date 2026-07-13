import { computed, ref, toValue } from 'vue';
import type { MaybeRefOrGetter } from 'vue';
import { LobbyStatus } from '@taku-biyori/shared';
import { getLobbyGuestLink } from '@/api/lobby';
import { useAuthStore } from '@/stores/auth';
import { useToast } from '@/composables/useToast';

/**
 * ホストがゲスト招待リンクを取得してクリップボードにコピーするための composable。
 * トークン取得 API はホスト限定（非ホストは 403）なので、発行可否もホストで判定する。
 * トークン自体は募集枠に紐づく資格情報なので、コピー時に都度取得する。
 * 読み取りは getter で受け取り、依存の向き（親→子）を一方向に保つ。
 */
export const useGuestLink = (
  lobbyId: string,
  hostUserId: MaybeRefOrGetter<string | null>,
  status: MaybeRefOrGetter<LobbyStatus | undefined>,
) => {
  const authStore = useAuthStore();
  const toast = useToast();

  /** API 取得・コピー処理中かどうか */
  const loading = ref(false);

  /** ログインユーザーがこの募集枠のホストか */
  const isHost = computed(() => {
    const hostId = toValue(hostUserId);
    return (
      !!authStore.currentUser &&
      hostId !== null &&
      hostId === authStore.currentUser.id
    );
  });

  /**
   * ゲスト招待リンクを発行できるか。ボタンの出し分けに使う。
   * トークン取得 API がホスト限定のため、ホストかつ status が open（募集中）のときのみ true。
   */
  const canIssueGuestLink = computed(
    () => isHost.value && toValue(status) === LobbyStatus.open,
  );

  /** 招待リンクを組み立てる。ゲストはログインユーザーと同じ募集枠詳細画面を ?token 付きで開く */
  function buildLink(token: string): string {
    return `${window.location.origin}/lobbies/${lobbyId}?token=${token}`;
  }

  /**
   * ゲスト招待用トークンを取得し、招待リンクを組み立ててクリップボードにコピーする。
   * 発行条件を満たさない場合・loading 中の重複呼び出しは無視する。
   * navigator.clipboard が未対応の環境ではエラーログを出す。
   */
  async function copyGuestLink() {
    if (loading.value || !canIssueGuestLink.value) {
      return;
    }
    loading.value = true;
    try {
      const { token } = await getLobbyGuestLink(lobbyId);
      const link = buildLink(token);
      if (!navigator.clipboard) {
        console.error(
          'navigator.clipboard は未対応の環境です。クリップボードへのコピーをスキップします。',
        );
        toast.error('ゲストリンクの取得に失敗しました');
        return;
      }
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
