import { computed, ref, toValue } from 'vue';
import type { MaybeRefOrGetter } from 'vue';
import { GameSessionAction, canPerform } from '@taku-biyori/shared';
import type { GameSessionStatus } from '@taku-biyori/shared';
import type { SeatModel } from '@/models/game-session';
import { updateSeat } from '@/api/game-session';
import { useAuthStore } from '@/stores/auth';
import { useToast } from '@/composables/useToast';

/**
 * 着席のキャラクター名を編集する。
 *
 * サーバ値（`seats`）と編集ドラフトを**別物として持つ**（CLAUDE.md）。
 * 同一視すると「元の値」が残らず変更検知ができない。
 *
 * 読み取りは getter で受け、書き込みは callback で所有者へ委譲する。
 * `Ref` を要求すると props 境界をまたいで書き換え可能になり、依存の向きが壊れる。
 */
export const useSeatEdit = (
  lobbyId: string,
  gameSessionId: string,
  seats: MaybeRefOrGetter<SeatModel[]>,
  status: MaybeRefOrGetter<GameSessionStatus | undefined>,
  hostUserId: MaybeRefOrGetter<string | undefined>,
  onUpdated: (updated: SeatModel) => void,
) => {
  const authStore = useAuthStore();
  const toast = useToast();
  const loading = ref(false);
  const isEditing = ref(false);

  /**
   * 編集ドラフト（seatId → キャラクター名）。
   * この ref はこの composable が所有するので `.value =` してよい。
   */
  const draftCharacterNames = ref<Map<string, string>>(new Map());

  /** 指定した席のドラフト値（未初期化なら空文字） */
  function draftOf(seatId: string) {
    return draftCharacterNames.value.get(seatId) ?? '';
  }

  function setDraft(seatId: string, value: string) {
    draftCharacterNames.value.set(seatId, value);
  }

  /** ログインユーザーがこの開催のホストか */
  const isHost = computed(
    () =>
      !!authStore.currentUser &&
      toValue(hostUserId) === authStore.currentUser.id,
  );

  /**
   * キャラクター名を編集できるか。
   * 可否は shared のポリシー表に委ねる（完了後でも編集できる。中止は不可。design-v2 §4-3）。
   */
  const canEditCharacterName = computed(() => {
    const currentStatus = toValue(status);
    if (!isHost.value || currentStatus === undefined) return false;
    return canPerform(GameSessionAction.assignCharacter, currentStatus, 'host');
  });

  /** サーバ由来のキャラクター名（基準値・空文字フォールバック） */
  function baselineOf(seat: SeatModel) {
    return seat.characterName ?? '';
  }

  /** いずれかの席のドラフトが基準値から変化しているか */
  const isDirty = computed(() =>
    toValue(seats).some((seat) => draftOf(seat.id) !== baselineOf(seat)),
  );

  /** 編集モードを開始し、全席の現在値で下書きを初期化する */
  function startEdit() {
    const next = new Map<string, string>();
    for (const seat of toValue(seats)) {
      next.set(seat.id, baselineOf(seat));
    }
    draftCharacterNames.value = next;
    isEditing.value = true;
  }

  function cancelEdit() {
    isEditing.value = false;
  }

  /**
   * 変更のあった席だけをまとめて送信する。
   * 成功ごとに onUpdated で所有者へ返す。失敗時は編集モードを維持する。
   */
  async function submitEdit() {
    if (loading.value) return;
    if (!isDirty.value) {
      isEditing.value = false;
      return;
    }
    loading.value = true;

    try {
      const changed = toValue(seats).filter(
        (seat) => draftOf(seat.id) !== baselineOf(seat),
      );
      for (const seat of changed) {
        const updated = await updateSeat(lobbyId, gameSessionId, seat.id, {
          // 空欄は解除（null）。空文字は API が受け付けない
          characterName: draftOf(seat.id) || null,
        });
        onUpdated(updated);
      }
      isEditing.value = false;
    } catch {
      toast.error('キャラクター名の更新に失敗しました');
    } finally {
      loading.value = false;
    }
  }

  return {
    canEditCharacterName,
    isEditing,
    isDirty,
    loading,
    draftOf,
    setDraft,
    startEdit,
    cancelEdit,
    submitEdit,
  };
};
