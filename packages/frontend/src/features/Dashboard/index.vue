<script setup lang="ts">
defineOptions({ name: 'AppDashboard' });
import GameSessionList from '@/features/GameSession/List/index.vue';
import LobbyList from '@/features/Lobby/List/index.vue';
</script>

<template>
  <div class="dashboard">
    <LobbyList title="ロビー" />
    <GameSessionList title="セッション" />
  </div>
</template>

<style scoped>
.dashboard {
  display: flex;
  flex-direction: column;
  gap: var(--space-6);
}
</style>
