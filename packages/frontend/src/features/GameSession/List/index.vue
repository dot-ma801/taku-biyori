<script setup lang="ts">
defineOptions({ name: 'GameSessionList' });
import MySessionList from '@/features/GameSession/List/MySessionList.vue';
import PublicSessionList from '@/features/GameSession/List/PublicSessionList.vue';
import { useGameSessionList } from '@/features/GameSession/List/useGameSessionList';
import type { GameSessionStatus } from '@taku-biyori/shared';
import { computed } from 'vue';

const props = defineProps<{
  title?: string;
  statuses?: GameSessionStatus[];
  sortByScheduledAt?: boolean;
  /** 該当セッションが1件も無いときにセクションごと描画しない */
  hideWhenEmpty?: boolean;
  /** 他人の公開セッションを描画しない（自分の履歴だけを見せるとき用） */
  hidePublic?: boolean;
}>();

const { filteredMySessions, filteredPublicSessions, hasFilteredSessions } =
  useGameSessionList({
    statuses: props.statuses,
    sortByScheduledAt: props.sortByScheduledAt,
    includePublic: !props.hidePublic,
  });

const hasTitle = computed(() => props.title != null);
const isVisible = computed(
  () => !props.hideWhenEmpty || hasFilteredSessions.value,
);
const hasFilteredPublicSessions = computed(
  () => filteredPublicSessions.value.length > 0,
);
</script>

<template>
  <div v-if="isVisible" class="container">
    <div v-if="hasTitle" class="section-header">
      <h2 class="section-title">{{ title }}</h2>
    </div>
    <MySessionList :my-sessions="filteredMySessions"></MySessionList>
    <PublicSessionList
      v-if="hasFilteredPublicSessions"
      :public-sessions="filteredPublicSessions"
    ></PublicSessionList>
  </div>
</template>

<style scoped>
.container {
  display: flex;
  flex-direction: column;
  gap: var(--space-4);
}

.section-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
}

.section-title {
  font-size: var(--font-size-lg);
  font-weight: 500;
  color: var(--color-text);
}
</style>
