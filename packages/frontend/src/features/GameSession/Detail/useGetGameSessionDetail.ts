import { ref, onMounted } from 'vue';
import { getGameSession } from '@/api/game-session';
import { ApiError } from '@/lib/api-client';
import type { GameSessionDetail, GameSessionMember } from '@taku-biyori/shared';
import { useRouter } from 'vue-router';

export const useGetGameSessionDetail = (id: string) => {
  const gameSession = ref<GameSessionDetail | null>(null);
  const loading = ref(false);
  const errorMessage = ref('');

  async function fetch() {
    loading.value = true;
    errorMessage.value = '';

    try {
      gameSession.value = await getGameSession(id);
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

  // Partial にすることで、変化したフィールドだけを渡せる（例: confirmDate は status と scheduledAt のみ更新）
  // 所有している実体は GameSessionDetail なので members などの詳細フィールドも差し替えられる。
  function patchGameSession(patch: Partial<GameSessionDetail>) {
    if (gameSession.value) {
      gameSession.value = { ...gameSession.value, ...patch };
    }
  }

  // members の加工は所有者であるこの composable に集約する。
  // 各画面・子 composable は callback でこれらを呼ぶだけ（書き込みは親に一方向）。

  /** メンバーを追加する（通常参加・ゲスト参加） */
  function addMember(member: GameSessionMember) {
    if (!gameSession.value) return;
    patchGameSession({ members: [...gameSession.value.members, member] });
  }

  /** メンバーを削除する（退出） */
  function removeMember(memberId: string) {
    if (!gameSession.value) return;
    patchGameSession({
      members: gameSession.value.members.filter((m) => m.id !== memberId),
    });
  }

  /** 既存メンバーを差し替える（キャラクター名編集など） */
  function updateMember(updated: GameSessionMember) {
    if (!gameSession.value) return;
    patchGameSession({
      members: gameSession.value.members.map((m) =>
        m.id === updated.id ? updated : m,
      ),
    });
  }

  const router = useRouter();
  const onClickEdit = () => {
    router.push({ name: 'game-sessions-edit', params: { gameSessionId: id } });
  };

  return {
    gameSession,
    loading,
    errorMessage,
    fetch,
    patchGameSession,
    addMember,
    removeMember,
    updateMember,
    onClickEdit,
  };
};
