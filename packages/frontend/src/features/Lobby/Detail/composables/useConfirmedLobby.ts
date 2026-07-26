import { computed, getCurrentInstance, onUnmounted, ref, toValue } from 'vue';
import type { MaybeRefOrGetter } from 'vue';
import type { LobbyDetail } from '@taku-biyori/shared';
import { useSession } from '@/lib/auth';

export type ViewerKind = 'selected' | 'notSelected' | 'guest' | 'neutral';

export const useConfirmedLobby = (
  lobby: MaybeRefOrGetter<LobbyDetail | null>,
  // NOTE: token は招待リンク（?token=）由来。ゲストとしての閲覧かどうかの判定に使う
  token: MaybeRefOrGetter<string | null>,
) => {
  const sessionData = ref(useSession.get());
  const unsub = useSession.subscribe((v) => {
    sessionData.value = v;
  });
  if (getCurrentInstance()) onUnmounted(unsub);

  const gameSessionId = computed(
    () => toValue(lobby)?.confirmedGameSession?.id ?? null,
  );

  const viewerKind = computed<ViewerKind>(() => {
    const l = toValue(lobby);
    if (!l?.confirmedGameSession) return 'neutral';

    const userId = sessionData.value.data?.user?.id;
    // ゲストは匿名なので個人を特定できない。招待リンク経由の閲覧かどうかだけで判定する
    if (!userId) return toValue(token) ? 'guest' : 'neutral';

    // ホストは常に selected
    if (userId === l.hostUserId) return 'selected';

    const myMember = l.members.find((m) => m.userId === userId);
    if (!myMember) return 'neutral';

    // 選出済みメンバーかどうか
    if (l.confirmedGameSession.selectedLobbyMemberIds.includes(myMember.id)) {
      return 'selected';
    }
    return 'notSelected';
  });

  return { viewerKind, gameSessionId };
};
