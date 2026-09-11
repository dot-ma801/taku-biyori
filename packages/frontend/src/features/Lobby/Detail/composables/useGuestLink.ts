import { computed, ref, toValue } from 'vue';
import type { MaybeRefOrGetter } from 'vue';
import {
  LobbyAction,
  LobbyStatus,
  canPerformLobbyAction,
} from '@taku-biyori/shared';
import { getLobbyGuestLink, regenerateLobbyGuestLink } from '@/api/lobby';
import { useAuthStore } from '@/stores/auth';
import { useToast } from '@/composables/useToast';

/** 招待リンクボタンを表示するステータス（UI 仕様） */
const GUEST_LINK_VISIBLE_STATUSES: LobbyStatus[] = [
  LobbyStatus.open,
  LobbyStatus.closed,
];

/**
 * ホストがゲスト招待リンクを取得してクリップボードにコピーするための composable。
 * トークン取得 API はホスト限定（非ホストは 403）なので、発行可否もホストで判定する。
 * トークン自体はロビーに紐づく資格情報なので、コピー時に都度取得する。
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

  /**
   * コピーできなかった招待リンク。コピーに成功したら null に戻る。
   *
   * 再発行は旧トークンを即座に無効にするため、コピーに失敗したまま黙ると
   * 旧リンクも新リンクも共有できなくなる。clipboard 未対応の環境や権限拒否でも
   * リンク自体は手で拾えるよう、ここに残して画面に出す。
   */
  const uncopiedLink = ref<string | null>(null);

  /**
   * リンクをクリップボードにコピーする。成功したら true。
   * 失敗しても投げず、`uncopiedLink` に残して呼び出し側の判断に委ねる。
   */
  async function copyToClipboard(link: string): Promise<boolean> {
    try {
      if (!navigator.clipboard) {
        console.error(
          'navigator.clipboard は未対応の環境です。クリップボードへのコピーをスキップします。',
        );
        uncopiedLink.value = link;
        return false;
      }
      await navigator.clipboard.writeText(link);
      uncopiedLink.value = null;
      return true;
    } catch {
      uncopiedLink.value = link;
      return false;
    }
  }

  /** ログインユーザーがこのロビーのホストか */
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
   * トークン取得 API がホスト限定のため、ホストかつ status が open / closed のときのみ true。
   * 参加自体は open のみ API 許可（closed では 422）だが、
   * closed では参加済みゲストへのリンク再共有（閲覧・日程回答）用途で発行を許す。
   */
  const canIssueGuestLink = computed(() => {
    const current = toValue(status);
    return (
      isHost.value &&
      current !== undefined &&
      GUEST_LINK_VISIBLE_STATUSES.includes(current)
    );
  });

  /** 招待リンクを組み立てる。ゲストはログインユーザーと同じロビー詳細画面を ?token 付きで開く */
  function buildLink(token: string): string {
    return `${window.location.origin}/lobbies/${lobbyId}?token=${token}`;
  }

  /**
   * ゲスト招待用トークンを取得し、招待リンクを組み立ててクリップボードにコピーする。
   * 発行条件を満たさない場合・loading 中の重複呼び出しは無視する。
   * コピーに失敗したときはリンクを `uncopiedLink` に残す
   * （clipboard 未対応の環境では押し直しても永久にコピーできないため）。
   */
  async function copyGuestLink() {
    if (loading.value || !canIssueGuestLink.value) {
      return;
    }
    loading.value = true;
    try {
      const { token } = await getLobbyGuestLink(lobbyId);
      const copied = await copyToClipboard(buildLink(token));
      if (copied) {
        toast.success('ゲストリンクをコピーしました');
      } else {
        toast.error(
          'ゲストリンクのコピーに失敗しました。表示されたリンクをコピーしてください',
        );
      }
    } catch {
      toast.error('ゲストリンクの取得に失敗しました');
    } finally {
      loading.value = false;
    }
  }

  /**
   * トークンを再発行できるか。ホストかつ解散済みでないときのみ true。
   * 配ってしまったリンクを失効させる手段なので、受付を閉じていても行える。
   */
  const canRegenerateGuestLink = computed(() => {
    const current = toValue(status);
    return (
      isHost.value &&
      current !== undefined &&
      canPerformLobbyAction(LobbyAction.regenerateGuestLink, current, 'host')
    );
  });

  /**
   * トークンを再発行し、新しい招待リンクをクリップボードにコピーする。
   * **旧トークンは即座に無効になる。**
   * 再発行不可・loading 中の重複呼び出しは無視する。
   */
  async function regenerateGuestLink() {
    if (loading.value || !canRegenerateGuestLink.value) {
      return;
    }
    loading.value = true;
    try {
      const { token } = await regenerateLobbyGuestLink(lobbyId);
      // ここから先、旧トークンはすでに無効。再発行の成否とコピーの成否を混ぜない
      const copied = await copyToClipboard(buildLink(token));
      if (copied) {
        toast.success('招待リンクを再発行してコピーしました');
      } else {
        toast.error(
          '招待リンクを再発行しましたが、コピーに失敗しました。表示されたリンクをコピーしてください',
        );
      }
    } catch {
      toast.error('招待リンクの再発行に失敗しました');
    } finally {
      loading.value = false;
    }
  }

  return {
    loading,
    uncopiedLink,
    canIssueGuestLink,
    copyGuestLink,
    canRegenerateGuestLink,
    regenerateGuestLink,
  };
};
