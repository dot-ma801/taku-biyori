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
}>();

const router = useRouter();
const {
  mySessions,
  publicSessions,
  filteredMySessions,
  filteredPublicSessions,
} = useGameSessionList({
  statuses: props.statuses,
  sortByScheduledAt: props.sortByScheduledAt,
});

const hasTitle = computed(() => props.title != null);
const hasFilteredPublicSessions = computed(
  () => filteredPublicSessions.value.length > 0,
);
const isFiltered = computed(() => props.statuses !== undefined);

const onClickCreate = () => {
  router.push({ name: 'game-sessions-new' });
};
</script>

<template>
  <div class="container">
    <div v-if="hasTitle" class="section-header">
      <h2 class="section-title">{{ title }}</h2>
      <BaseButton :left-icon="Plus" @click="onClickCreate"
        >セッションを作成</BaseButton
      >
    </div>
    <BaseButton
      v-else
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
  font-weight: 600;
  color: var(--color-text);
}

.create-btn {
  align-self: flex-end;
}
</style>
