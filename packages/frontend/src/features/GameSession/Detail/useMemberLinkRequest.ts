import { computed, getCurrentInstance, onUnmounted, ref, toValue } from 'vue';
import type { MaybeRefOrGetter } from 'vue';
import type { GameSessionMember } from '@taku-biyori/shared';
import { requestGameSessionMemberLink } from '@/api/game-session';
import { useSession } from '@/lib/auth';
import { useToast } from '@/composables/useToast';

/**
 * ゲストとして参加した記録を、後から取得したアカウントへ紐づけるよう申請する
 * composable（ADR 0008）。
 *
 * 申請にゲストトークンは要らない。ゲストリンクは認証の往復（OAuth のリダイレクト）で
 * 失われるうえ、卓ごとの共有トークンなので本人性を証明しないため。
 * 「どの行が自分か」はクライアントに保存させず、本人が画面で選ぶ。
 */
export const useMemberLinkRequest = (
  gameSessionId: string,
  // NOTE: 読み取りは getter で受ける。Ref を要求すると呼び出し側の状態を書き換えられてしまうため。
  members: MaybeRefOrGetter<GameSessionMember[]>,
  hostUserId: MaybeRefOrGetter<string>,
  // NOTE: 申請後の再取得は所有者（親）に委譲する。
  onRequested: () => void | Promise<void>,
) => {
  // useSession は nanostores の Atom なので Vue の ref に変換する
  const sessionData = ref(useSession.get());
  const unsubscribeSession = useSession.subscribe((v) => {
    sessionData.value = v;
  });

  // コンポーネント外（テスト等）から呼ばれた場合は onUnmounted を登録しない
  if (getCurrentInstance()) {
    onUnmounted(() => {
      unsubscribeSession();
    });
  }

  const toast = useToast();
  const loading = ref(false);

  /**
   * 選択中のゲスト行。編集ドラフトなのでこの composable が所有する。
   * 空文字は未選択。BaseRadioGroup の v-model にそのまま渡せる形にしている。
   */
  const selectedMemberId = ref('');

  const myUserId = computed(() => sessionData.value.data?.user?.id ?? null);

  /** 紐づけ先の候補になるゲスト行（user_id が null のメンバー） */
  const guestMembers = computed(() =>
    toValue(members).filter((m) => m.userId === null),
  );

  const isMember = computed(() =>
    toValue(members).some((m) => m.userId === myUserId.value),
  );

  const isHost = computed(() => toValue(hostUserId) === myUserId.value);

  /**
   * 紐づけを申請できるか。
   * ログイン済みで、まだこの卓のメンバーでなく、名乗り出られるゲスト行があるときのみ。
   */
  const canRequestLink = computed(
    () =>
      myUserId.value !== null &&
      !isMember.value &&
      !isHost.value &&
      guestMembers.value.length > 0,
  );

  /**
   * 選択したゲスト行の紐づけを申請する。
   * 承認はホストが行うため、ここでは申請が受理された旨のみ通知する。
   */
  async function submit() {
    if (loading.value) return;

    const memberId = selectedMemberId.value;
    if (!memberId) {
      toast.error('紐づけたい参加者を選択してください');
      return;
    }

    loading.value = true;
    try {
      await requestGameSessionMemberLink(gameSessionId, memberId);
      selectedMemberId.value = '';
      toast.success('申請しました。主催者が承認すると紐づけられます');
      await onRequested();
    } catch {
      toast.error('申請に失敗しました');
    } finally {
      loading.value = false;
    }
  }

  return {
    selectedMemberId,
    guestMembers,
    canRequestLink,
    loading,
    submit,
  };
};
