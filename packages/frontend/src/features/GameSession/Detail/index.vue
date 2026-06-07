<script setup lang="ts">
defineOptions({ name: 'GameSessionDetail' });
import BaseSectionHeading from '@/components/common/BaseSectionHeading/BaseSectionHeading.vue';
import MemberDisplay from '@/features/GameSession/Detail/MemberDisplay.vue';
import MemoDisplay from '@/features/GameSession/Detail/MemoDisplay.vue';
import ScenarioInfoDisplay from '@/features/GameSession/Detail/ScenarioInfoDisplay.vue';
import ScheduleDisplay from '@/features/GameSession/Detail/ScheduleDisplay.vue';
import { useGetGameSessionDetail } from '@/features/GameSession/Detail/useGetGameSessionDetail';
import { computed, onMounted } from 'vue';
import { Album, UsersRound, UserRoundPlus , SquarePen } from '@lucide/vue';
import BaseButton from '@/components/button/BaseButton.vue';

const props = defineProps<{ gameSessionId: string }>();

const { gameSession, loading, errorMessage, fetch } = useGetGameSessionDetail(
  props.gameSessionId,
);

onMounted(fetch);

// NOTE: UIの関心事なので、composable ではなくコンポーネント側に定義する
const scenarioName = computed(() => gameSession.value?.scenarioName ?? '未設定');
const maxMembers = computed(() => gameSession.value?.maxMembers ?? '未設定');
const description = computed(() => gameSession.value?.description ?? undefined);
</script>

<template>
  <div v-if="loading">読み込み中...</div>
  <div v-else-if="errorMessage">{{ errorMessage }}</div>

  <div v-else-if="gameSession" class="container">
    <div>
      <BaseSectionHeading level="h1">
        {{ gameSession.title }}
      </BaseSectionHeading>

      <div class="session-meta-bar">
        <div class="description">
          <Album :size="16" />
          <p>シナリオ：{{ scenarioName }}</p>
          <UsersRound :size="16" />
          <p>募集人数: {{ maxMembers }}</p>
        </div>
        <div class="button-area">
          <BaseButton :left-icon="SquarePen" variant="secondary">セッション編集</BaseButton>
          <BaseButton :left-icon="UserRoundPlus ">参加する</BaseButton>
        </div>
      </div>
    </div>

    <!-- シナリオの詳細文で v-if する -->
    <ScenarioInfoDisplay v-if="false"></ScenarioInfoDisplay>
    <MemoDisplay :text="description"></MemoDisplay>
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

.session-meta-bar {
  display: flex;
  justify-content: space-between;
  
  .description {
    display: grid;
    grid-template-columns: auto 1fr;
    grid-template-rows: 1fr 1fr;
    align-items: center;
    
    gap: 0 var(--space-1);
    padding-left: var(--space-3);
  }

  .button-area {
    >* {
      margin: 0 var(--space-1);
    }
  }
}
</style>
