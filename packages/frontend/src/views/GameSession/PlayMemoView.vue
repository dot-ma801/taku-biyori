<script setup lang="ts">
import { computed, watch } from 'vue';
import { useRouter } from 'vue-router';
import PageContainer from '@/components/layout/PageContainer/PageContainer.vue';
import BaseButton from '@/components/button/BaseButton.vue';
import PlayMemoEditor from '@/features/GameSession/PlayMemo/PlayMemoEditor.vue';
import { useGetGameSessionDetail } from '@/features/GameSession/Detail/useGetGameSessionDetail';
import { useMyPlayMemo } from '@/features/GameSession/PlayMemo/useMyPlayMemo';

const props = defineProps<{ gameSessionId: string }>();

const router = useRouter();

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
watch([loadingDetail, gameSession], ([isLoading, session]) => {
  if (isLoading || !session || isMyMemo.value) return;
  void router.replace({
    name: 'game-sessions-detail',
    params: { gameSessionId: props.gameSessionId },
  });
});
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
