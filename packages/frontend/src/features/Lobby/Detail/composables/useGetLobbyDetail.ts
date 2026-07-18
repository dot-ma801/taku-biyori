import { computed, ref, onMounted } from 'vue';
import { getLobby } from '@/api/lobby';
import { ApiError } from '@/lib/api-client';
import type { LobbyDetail, LobbyMember } from '@taku-biyori/shared';

export const useGetLobbyDetail = (id: string) => {
  const lobby = ref<LobbyDetail | null>(null);
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
  // 所有している実体は LobbyDetail なので members などの詳細フィールドも差し替えられる。
  function patchLobby(patch: Partial<LobbyDetail>) {
    if (lobby.value) {
      lobby.value = { ...lobby.value, ...patch };
    }
  }

  // members の加工は所有者であるこの composable に集約する。
  // 各画面・子 composable は callback でこれらを呼ぶだけ（書き込みは親に一方向）。

  /** メンバーを追加する（通常参加・ゲスト参加） */
  function addMember(member: LobbyMember) {
    if (!lobby.value) {
      return;
    }
    patchLobby({ members: [...lobby.value.members, member] });
  }

  /** メンバーを削除する（退出・ホストによる取り消し） */
  function removeMember(memberId: string) {
    if (!lobby.value) {
      return;
    }
    patchLobby({
      members: lobby.value.members.filter((m) => m.id !== memberId),
    });
  }

  /** 参加人数（「5 / 定員3」表示用。定員は lobby.maxPlayers を UI が直接参照する） */
  const memberCount = computed(() => lobby.value?.members.length ?? 0);

  return {
    lobby,
    loading,
    errorMessage,
    fetch,
    patchLobby,
    addMember,
    removeMember,
    memberCount,
  };
};
