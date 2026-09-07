<script setup lang="ts">
import GameSessionDetail from '@/features/GameSession/Detail/GameSessionDetail.vue';
import PageContainer from '@/components/layout/PageContainer/PageContainer.vue';

defineProps<{
  lobbyId: string;
  /** 開催の URL から来たときに開くタブ */
  initialTab?: string;
}>();
</script>

<template>
  <PageContainer size="lg">
    <GameSessionDetail :lobby-id="lobbyId" :initial-tab="initialTab" />
  </PageContainer>
</template>
