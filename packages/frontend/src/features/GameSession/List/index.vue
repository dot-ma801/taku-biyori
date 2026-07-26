<script setup lang="ts">
defineOptions({ name: 'GameSessionList' });
import BaseButton from '@/components/button/BaseButton.vue';
import MySessionList from '@/features/GameSession/List/MySessionList.vue';
import PublicSessionList from '@/features/GameSession/List/PublicSessionList.vue';
import { useGameSessionList } from '@/features/GameSession/List/useGameSessionList';
import type { GameSessionStatus } from '@taku-biyori/shared';
import { Plus } from '@lucide/vue';
import { computed } from 'vue';
import { useRouter } from 'vue-router';

const props = defineProps<{
  title?: string;
  statuses?: GameSessionStatus[];
  sortByScheduledAt?: boolean;
  /** 該当セッションが1件も無いときにセクションごと描画しない */
  hideWhenEmpty?: boolean;
  /** 作成ボタンを描画しない（同じ画面に複数セクションを並べるとき用） */
  hideCreateButton?: boolean;
}>();

const router = useRouter();
const {
  mySessions,
  publicSessions,
  filteredMySessions,
  filteredPublicSessions,
  hasFilteredSessions,
} = useGameSessionList({
  statuses: props.statuses,
  sortByScheduledAt: props.sortByScheduledAt,
});

const hasTitle = computed(() => props.title != null);
const isVisible = computed(
  () => !props.hideWhenEmpty || hasFilteredSessions.value,
);
const showCreateButton = computed(() => !props.hideCreateButton);
const hasFilteredPublicSessions = computed(
  () => filteredPublicSessions.value.length > 0,
);
const isFiltered = computed(() => props.statuses !== undefined);

const onClickCreate = () => {
  router.push({ name: 'game-sessions-new' });
};
</script>

<template>
  <div v-if="isVisible" class="container">
    <div v-if="hasTitle" class="section-header">
      <h2 class="section-title">{{ title }}</h2>
      <BaseButton
        v-if="showCreateButton"
        :left-icon="Plus"
        @click="onClickCreate"
        >セッションを作成</BaseButton
      >
    </div>
    <BaseButton
      v-else-if="showCreateButton"
      class="create-btn"
      :left-icon="Plus"
      @click="onClickCreate"
      >セッションを作成</BaseButton
    >
    <template v-if="isFiltered">
      <MySessionList :my-sessions="filteredMySessions"></MySessionList>
      <PublicSessionList
        v-if="hasFilteredPublicSessions"
        :public-sessions="filteredPublicSessions"
      ></PublicSessionList>
    </template>
    <template v-else>
      <MySessionList :my-sessions="mySessions"></MySessionList>
      <PublicSessionList :public-sessions="publicSessions"></PublicSessionList>
    </template>
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

.create-btn {
  align-self: flex-end;
}
</style>
