import { computed, ref, toValue } from 'vue';
import type { MaybeRefOrGetter } from 'vue';
import { GameSessionAction, canPerform } from '@taku-biyori/shared';
import type { GameSessionStatus } from '@taku-biyori/shared';
import type { LobbyEntryModel } from '@/models/lobby';
import type { SeatModel } from '@/models/game-session';
import { createSeat, deleteSeat } from '@/api/game-session';
import { useAuthStore } from '@/stores/auth';
import { useToast } from '@/composables/useToast';

/**
 * 着席させる / 外す（design-v2 §6-6）。
 *
 * **着席させられるのはホストだけ。** 着席は選出のファクトであり、選出はホストの仕事。
 * v0.2 にあった「自分で参加する」経路は廃止したので、参加者向けの操作は無い
 * （自分の席を外すことだけは本人にもできる）。
 */
export const useSeatManagement = (
  lobbyId: string,
  gameSessionId: string,
  status: MaybeRefOrGetter<GameSessionStatus | undefined>,
  hostUserId: MaybeRefOrGetter<string | undefined>,
  seats: MaybeRefOrGetter<SeatModel[]>,
  /** ロビーの在籍中の参加者。着席候補の母集団 */
  activeEntries: MaybeRefOrGetter<LobbyEntryModel[]>,
  onSeated: (seat: SeatModel) => void,
  onUnseated: (seatId: string) => void,
) => {
  const authStore = useAuthStore();
  const toast = useToast();
  const loading = ref(false);

  const isHost = computed(
    () =>
      !!authStore.currentUser &&
      toValue(hostUserId) === authStore.currentUser.id,
  );

  const allows = (action: GameSessionAction, role: 'host' | 'member') => {
    const currentStatus = toValue(status);
    if (currentStatus === undefined) return false;
    return canPerform(action, currentStatus, role);
  };

  /** ホストが着席させられるか */
  const canSeat = computed(
    () => isHost.value && allows(GameSessionAction.seatEntry, 'host'),
  );

  /** まだ着席していない在籍中の参加者。着席候補として出す */
  const seatableEntries = computed(() => {
    const seatedEntryIds = new Set(toValue(seats).map((seat) => seat.entryId));
    return toValue(activeEntries).filter(
      (entry) => !seatedEntryIds.has(entry.id),
    );
  });

  /** 指定した席を外せるか。本人またはホスト（本人性はここで判定する。§4-5） */
  function canUnseat(seat: SeatModel): boolean {
    const myUserId = authStore.currentUser?.id;
    const isSelf = seat.userId !== null && seat.userId === myUserId;
    if (!isHost.value && !isSelf) return false;
    return allows(GameSessionAction.unseat, isHost.value ? 'host' : 'member');
  }

  async function seat(entryId: string) {
    if (loading.value || !canSeat.value) return;
    loading.value = true;
    try {
      const created = await createSeat(lobbyId, gameSessionId, { entryId });
      onSeated(created);
    } catch {
      toast.error('着席させられませんでした');
    } finally {
      loading.value = false;
    }
  }

  async function unseat(seatId: string) {
    if (loading.value) return;
    loading.value = true;
    try {
      await deleteSeat(lobbyId, gameSessionId, seatId);
      onUnseated(seatId);
    } catch {
      toast.error('離席できませんでした');
    } finally {
      loading.value = false;
    }
  }

  return {
    isHost,
    canSeat,
    canUnseat,
    seatableEntries,
    loading,
    seat,
    unseat,
  };
};
