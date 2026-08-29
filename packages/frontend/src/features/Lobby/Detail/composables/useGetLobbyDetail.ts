import { computed, ref, onMounted } from 'vue';
import { getLobby } from '@/api/lobby';
import { ApiError } from '@/lib/api-client';
import type { LobbyDetailModel, LobbyEntryModel } from '@/models/lobby';
import { withEntries } from '@/models/lobby';

export const useGetLobbyDetail = (id: string) => {
  const lobby = ref<LobbyDetailModel | null>(null);
  const loading = ref(false);
  const errorMessage = ref('');

  async function fetch() {
    loading.value = true;
    errorMessage.value = '';

    try {
      lobby.value = await getLobby(id);
    } catch (err) {
      if (err instanceof ApiError) {
        errorMessage.value = err.message;
      } else {
        errorMessage.value = 'エラーが発生しました';
      }
    } finally {
      loading.value = false;
    }
  }

  onMounted(fetch);

  // Partial にすることで、変化したフィールドだけを渡せる（例: status のみ更新）
  // 所有している実体は LobbyDetailModel なので entries などの詳細フィールドも差し替えられる。
  function patchLobby(patch: Partial<LobbyDetailModel>) {
    if (lobby.value) {
      lobby.value = { ...lobby.value, ...patch };
    }
  }

  // entries の加工は所有者であるこの composable に集約する。
  // 各画面・子 composable は callback でこれらを呼ぶだけ（書き込みは親に一方向）。
  // entries と activeEntries の整合は withEntries が引き受ける。

  /** 参加者を追加する（通常参加・ゲスト参加） */
  function addEntry(entry: LobbyEntryModel) {
    if (!lobby.value) {
      return;
    }
    patchLobby(withEntries([...lobby.value.entries, entry]));
  }

  /** 参加者を取り除く（脱退・ホストによる取り消し） */
  function removeEntry(entryId: string) {
    if (!lobby.value) {
      return;
    }
    patchLobby(
      withEntries(lobby.value.entries.filter((e) => e.id !== entryId)),
    );
  }

  /** 在籍中の参加人数（「5 / 定員3」表示用。定員は lobby.maxPlayers を UI が直接参照する） */
  const activeEntryCount = computed(
    () => lobby.value?.activeEntries.length ?? 0,
  );

  return {
    lobby,
    loading,
    errorMessage,
    fetch,
    patchLobby,
    addEntry,
    removeEntry,
    activeEntryCount,
  };
};
