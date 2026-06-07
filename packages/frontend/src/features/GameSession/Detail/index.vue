<script setup lang="ts">
defineOptions({ name: 'GameSessionDetail' });
import BaseSectionHeading from '@/components/common/BaseSectionHeading/BaseSectionHeading.vue';
import MemberDisplay from '@/features/GameSession/Detail/MemberDisplay.vue';
import MemoDisplay from '@/features/GameSession/Detail/MemoDisplay.vue';
import ScenarioInfoDisplay from '@/features/GameSession/Detail/ScenarioInfoDisplay.vue';
import ScheduleDisplay from '@/features/GameSession/Detail/ScheduleDisplay.vue';
import { ref } from 'vue';
import { Album, UsersRound } from '@lucide/vue';

const title = ref('セッションタイトル');
</script>

<template>
  <div class="container">
    <div>
      <BaseSectionHeading level="h1">{{ title }}</BaseSectionHeading>
      <div class="description">
        <Album :size="16" />
        <p>シナリオ：{{}}</p>
        <UsersRound :size="16" />
        <p>募集人数: {{}}</p>
      </div>
    </div>

    <ScenarioInfoDisplay></ScenarioInfoDisplay>
    <MemoDisplay></MemoDisplay>
    <ScheduleDisplay></ScheduleDisplay>
    <MemberDisplay></MemberDisplay>
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
