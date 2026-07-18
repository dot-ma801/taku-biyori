<script setup lang="ts">
defineOptions({ name: 'AppDashboard' });
import GameSessionList from '@/features/GameSession/List/index.vue';
import LobbyList from '@/features/Lobby/List/index.vue';
</script>

<template>
  <div class="dashboard">
    <section>
      <h2 class="section-title">募集枠</h2>
      <LobbyList />
    </section>
    <section>
      <h2 class="section-title">セッション</h2>
      <GameSessionList />
    </section>
  </div>
</template>

<style scoped>
.dashboard {
  display: flex;
  flex-direction: column;
  gap: var(--space-6);
}

.section-title {
  font-size: var(--font-size-lg);
  font-weight: 600;
  margin-bottom: var(--space-3);
  color: var(--color-text);
}
</style>
