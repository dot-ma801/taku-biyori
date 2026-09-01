<script setup lang="ts">
import GameSessionDetailPage from '@/features/GameSession/Detail/index.vue';
import PageContainer from '@/components/layout/PageContainer/PageContainer.vue';

const props = defineProps<{ lobbyId: string; gameSessionId: string }>();
</script>

<template>
  <PageContainer>
    <GameSessionDetailPage
      :lobby-id="props.lobbyId"
      :game-session-id="props.gameSessionId"
    ></GameSessionDetailPage>
  </PageContainer>
</template>

<style scoped></style>
