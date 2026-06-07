<script setup lang="ts">
import GameSessionDetail from '@/features/GameSession/Detail/index.vue';

const props = defineProps<{ gameSessionId: string }>();
</script>

<template>
  <GameSessionDetail :game-session-id="props.gameSessionId"></GameSessionDetail>
</template>

<style scoped></style>
