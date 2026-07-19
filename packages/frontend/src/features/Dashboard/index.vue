<script setup lang="ts">
defineOptions({ name: 'AppDashboard' });
import GameSessionList from '@/features/GameSession/List/index.vue';
import LobbyList from '@/features/Lobby/List/index.vue';
import { LobbyStatus, GameSessionStatus } from '@taku-biyori/shared';
</script>

<template>
  <div class="dashboard">
    <LobbyList
      title="募集・調整中"
      :statuses="[LobbyStatus.open, LobbyStatus.scheduling]"
    />
    <GameSessionList
      title="開催予定の卓"
      :statuses="[GameSessionStatus.confirmed, GameSessionStatus.today]"
      sort-by-scheduled-at
    />
  </div>
</template>

<style scoped>
.dashboard {
  display: flex;
  flex-direction: column;
  gap: var(--space-6);
}
</style>
