<script setup lang="ts">
import { computed, watch } from 'vue';
import { useRouter } from 'vue-router';
import PageContainer from '@/components/layout/PageContainer/PageContainer.vue';
import BaseButton from '@/components/button/BaseButton.vue';
import PlayMemoEditor from '@/features/GameSession/PlayMemo/PlayMemoEditor.vue';
import { useGetGameSessionDetail } from '@/features/GameSession/Detail/useGetGameSessionDetail';
import { useMyPlayMemo } from '@/features/GameSession/PlayMemo/useMyPlayMemo';
import { useAuthStore } from '@/stores/auth';

const props = defineProps<{ gameSessionId: string }>();

const router = useRouter();
const authStore = useAuthStore();

const {
  gameSession,
  loading: loadingDetail,
  errorMessage,
} = useGetGameSessionDetail(props.gameSessionId);

const {
  playMemo,
  loading: loadingMemo,
  isMyMemo,
  canEditBody,
  fetch: fetchPlayMemo,
  applySaved,
} = useMyPlayMemo(props.gameSessionId, () => gameSession.value);

const loading = computed(() => loadingDetail.value || loadingMemo.value);
const isReady = computed(() => !!gameSession.value && !!playMemo.value);
const gameSessionTitle = computed(() => gameSession.value?.title ?? '');

/**
 * メンバーなのにメモを取得できなかった状態。
 * この画面はメモが主役なので、卓詳細と違って黙って閉じずに再試行を出す。
 */
const loadFailed = computed(
  () =>
    !loading.value &&
    !!gameSession.value &&
    isMyMemo.value &&
    playMemo.value === null,
);

// メモを持てない相手がこの URL を直接開いたケース（退出後・他人の卓など）。
// 履歴を汚さないよう replace で卓詳細へ戻す。未ログインはルートガードが
// ログインへ流すため、ここでは扱わない。
//
// 現状は meta.requiresAuth: true によりルートガードがセッション復元を
// 待ってから入るため偶然成立しているが、design-v1.2 §6 は公開メモの閲覧を
// 載せる段階4 で requiresAuth を外すと明記している。外れた瞬間に
// 「復元前 → currentUser が null → isMyMemo false」でメンバーが弾かれない
// よう、ここでも useMyPlayMemo.fetch() と同様に復元の完了を待つ。
// isMyMemo も watch のソースに含め、members が後から差し替わっても
// 再評価されるようにする。
watch(
  () => ({
    loading: loadingDetail.value,
    session: gameSession.value,
    isMine: isMyMemo.value,
  }),
  async ({ loading, session }) => {
    if (loading || !session) return;
    await authStore.ensureSessionReady();
    if (isMyMemo.value) return;
    void router.replace({
      name: 'game-sessions-detail',
      params: { gameSessionId: props.gameSessionId },
    });
  },
);
</script>

<template>
  <PageContainer>
    <div v-if="errorMessage">{{ errorMessage }}</div>

    <PlayMemoEditor
      v-else-if="isReady"
      :game-session-id="props.gameSessionId"
      :game-session-title="gameSessionTitle"
      :play-memo="playMemo"
      :can-edit-body="canEditBody"
      @saved="applySaved"
    />

    <div v-else-if="loadFailed" class="failed">
      <p class="failed__text">メモを読み込めませんでした。</p>
      <BaseButton variant="secondary" @click="fetchPlayMemo">
        再読み込み
      </BaseButton>
    </div>

    <div v-else>読み込み中...</div>
  </PageContainer>
</template>

<style scoped>
.failed {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: var(--space-3);
  padding: var(--space-6) var(--space-3);
}

.failed__text {
  margin: 0;
  color: var(--color-text-secondary);
}
</style>
