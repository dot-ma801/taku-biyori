import { computed, ref, toValue } from 'vue';
import type { MaybeRefOrGetter } from 'vue';
import type { GameSessionMember } from '@taku-biyori/shared';
import { GameSessionStatus } from '@taku-biyori/shared';
import { updateMember } from '@/api/game-session';
import { useAuthStore } from '@/stores/auth';
import { useToast } from '@/composables/useToast';

const EDITABLE_STATUSES = new Set<GameSessionStatus>([
  GameSessionStatus.open,
  GameSessionStatus.scheduling,
  GameSessionStatus.confirmed,
  GameSessionStatus.today,
]);

export const useMemberEdit = (
  gameSessionId: string,
  // NOTE: 読み取りは getter で受ける。Ref を要求すると props 境界をまたいで
  //       書き換え可能になり、依存の向き（親→子）が壊れるため。
  members: MaybeRefOrGetter<GameSessionMember[]>,
  status: MaybeRefOrGetter<GameSessionStatus | undefined>,
  createdBy: MaybeRefOrGetter<string>,
  // NOTE: 書き込みは callback で所有者（親）に委譲する。composable は
  //       自分が所有していない状態を直接書き換えない。
  onUpdated: (updated: GameSessionMember) => void,
) => {
  const authStore = useAuthStore();
  const toast = useToast();
  const loading = ref(false);
  const isEditing = ref(false);

  /**
   * 編集ドラフト（memberId → キャラクター名）。
   * サーバ値（members）とは分離して保持し、変更検知・キャンセルを成立させる。
   * この ref はこの composable が所有するので、v-model 経由の書き込みを許可する
   * （`v-model="draftCharacterNames[member.id]"`）。
   */
  const draftCharacterNames = ref<Record<string, string>>({});

  /** 指定メンバーのドラフト値（未初期化なら空文字） */
  function draftOf(memberId: string) {
    return draftCharacterNames.value[memberId] ?? '';
  }

  /** ログインユーザーがこのセッションのホスト（GM）か */
  const isHost = computed(
    () =>
      !!authStore.currentUser &&
      toValue(createdBy) === authStore.currentUser.id,
  );

  /** キャラクター名を編集できるか。GM かつセッションが進行中のとき true */
  const canEditCharacterName = computed(() => {
    const currentStatus = toValue(status);
    return (
      isHost.value &&
      currentStatus !== undefined &&
      EDITABLE_STATUSES.has(currentStatus)
    );
  });

  /** 指定メンバーのサーバ由来キャラクター名（基準値・空文字フォールバック） */
  function baselineOf(member: GameSessionMember) {
    return member.characterName ?? '';
  }

  /** いずれかのメンバーのドラフトが基準値から変化しているか */
  const isDirty = computed(() =>
    toValue(members).some((m) => draftOf(m.id) !== baselineOf(m)),
  );

  /** 編集モードを開始し、全メンバーの現在値で下書きを初期化する */
  function startEdit() {
    const next: Record<string, string> = {};
    for (const m of toValue(members)) {
      next[m.id] = baselineOf(m);
    }
    draftCharacterNames.value = next;
    isEditing.value = true;
  }

  /** 編集をキャンセルして編集モードを終了する */
  function cancelEdit() {
    isEditing.value = false;
  }

  /**
   * 変更があったメンバーのキャラクター名をまとめて送信する。
   * 各成功ごとに onUpdated コールバックで更新後メンバーを所有者へ渡す。
   * 失敗時は isEditing を維持したまま toast.error を表示する。
   * loading 中の重複呼び出しは無視する。
   */
  async function submitEdit() {
    if (loading.value) return;
    if (!isDirty.value) {
      isEditing.value = false;
      return;
    }
    loading.value = true;

    try {
      const changed = toValue(members).filter(
        (m) => draftOf(m.id) !== baselineOf(m),
      );
      for (const member of changed) {
        const updated = await updateMember(gameSessionId, member.id, {
          characterName: draftOf(member.id) || null,
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
    draftCharacterNames,
    startEdit,
    cancelEdit,
    submitEdit,
  };
};
