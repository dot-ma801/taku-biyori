<script setup lang="ts">
import GameSessionDetail from '@/features/GameSession/Detail/index.vue';
import PageContainer from '@/components/layout/PageContainer/PageContainer.vue';

const props = defineProps<{ gameSessionId: string }>();
</script>

<template>
  <PageContainer>
    <GameSessionDetail
      :game-session-id="props.gameSessionId"
    ></GameSessionDetail>
  </PageContainer>
</template>

<style scoped></style>
