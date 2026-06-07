<script setup lang="ts">
defineOptions({ name: 'GameSessionDetail' });
import BaseSectionHeading from '@/components/common/BaseSectionHeading/BaseSectionHeading.vue';
import MemberDisplay from '@/features/GameSession/Detail/MemberDisplay.vue';
import MemoDisplay from '@/features/GameSession/Detail/MemoDisplay.vue';
import ScenarioInfoDisplay from '@/features/GameSession/Detail/ScenarioInfoDisplay.vue';
import ScheduleDisplay from '@/features/GameSession/Detail/ScheduleDisplay.vue';
import { useGetGameSessionDetail } from '@/features/GameSession/Detail/useGetGameSessionDetail';
import { onMounted } from 'vue';
import { Album, UsersRound } from '@lucide/vue';

const props = defineProps<{ gameSessionId: string }>();

const { gameSession, loading, errorMessage, fetch } = useGetGameSessionDetail(
  props.gameSessionId,
);

onMounted(fetch);
</script>

<template>
  <div v-if="loading">読み込み中...</div>
  <div v-else-if="errorMessage">{{ errorMessage }}</div>

  <div v-else-if="gameSession" class="container">
    <div>
      <BaseSectionHeading level="h1">
        {{ gameSession.title }}
      </BaseSectionHeading>

      <div class="description">
        <Album :size="16" />
        <p>シナリオ：{{ gameSession.scenarioName ?? '未設定' }}</p>
        <UsersRound :size="16" />
        <p>募集人数: {{ gameSession.maxMembers ?? '未設定' }}</p>
      </div>
    </div>

    <ScenarioInfoDisplay></ScenarioInfoDisplay>
    <MemoDisplay :text="gameSession.description ?? undefined"></MemoDisplay>
    <ScheduleDisplay></ScheduleDisplay>
    <MemberDisplay :members="gameSession.members"></MemberDisplay>
  </div>
</template>

<style scoped>
.container {
  display: flex;
  flex-direction: column;
  gap: var(--space-5);
}

.description {
  display: grid;
  grid-template-columns: auto 1fr;
  grid-template-rows: 1fr 1fr;
  align-items: center;

  gap: 0 var(--space-1);
  padding-left: var(--space-3);
}
</style>
