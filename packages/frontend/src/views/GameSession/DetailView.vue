<script setup lang="ts">
import GameSessionDetail from '@/features/GameSession/Detail/GameSessionDetail.vue';
import PageContainer from '@/components/layout/PageContainer/PageContainer.vue';

defineProps<{
  lobbyId: string;
  /** 開催の URL から来たときに名指しされている開催 */
  gameSessionId?: string;
  /** 開催の URL から来たときに開くタブ */
  initialTab?: string;
}>();
</script>

<template>
  <PageContainer size="lg">
    <GameSessionDetail
      :lobby-id="lobbyId"
      :game-session-id="gameSessionId"
      :initial-tab="initialTab"
    />
  </PageContainer>
</template>
