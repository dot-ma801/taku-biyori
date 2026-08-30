<script setup lang="ts">
defineOptions({ name: 'LobbyDetail' });

import BaseSectionHeading from '@/components/common/BaseSectionHeading/BaseSectionHeading.vue';
import ActionBar from '@/features/Lobby/Detail/ActionBar.vue';
import StatusDisplay from '@/features/Lobby/Detail/StatusDisplay.vue';
import MemberDisplay from '@/features/Lobby/Detail/MemberDisplay.vue';
import MemoDisplay from '@/features/Lobby/Detail/MemoDisplay.vue';
import ScheduleDisplay from '@/features/Lobby/Detail/Schedule/ScheduleDisplay.vue';
import { useGetLobbyDetail } from '@/features/Lobby/Detail/composables/useGetLobbyDetail';
import { computed } from 'vue';
import { Album, UsersRound, MapPin } from '@lucide/vue';

const props = defineProps<{ lobbyId: string }>();

const { lobby, patchLobby, addEntry, removeEntry, activeEntryCount, fetch } =
  useGetLobbyDetail(props.lobbyId);

const scenarioName = computed(() => lobby.value?.scenarioName ?? '未設定');

const capacityText = computed(() => {
  const max = lobby.value?.maxPlayers;
  return max != null
    ? `${activeEntryCount.value} / 定員${max}`
    : `${activeEntryCount.value} / 定員未設定`;
});

const location = computed(() => lobby.value?.location ?? '未設定');
</script>

<template>
  <div class="container" v-if="lobby">
    <BaseSectionHeading level="h1">
      {{ lobby.title }}
    </BaseSectionHeading>

    <div class="session-meta-bar">
      <div class="description">
        <Album :size="16" />
        <p>シナリオ：{{ scenarioName }}</p>
        <UsersRound :size="16" />
        <p>参加者：{{ capacityText }}</p>
        <MapPin :size="16" />
        <p>場所：{{ location }}</p>
      </div>

      <div class="action-bar-wrapper">
        <ActionBar
          :lobby="lobby"
          @updated="patchLobby"
          @member-added="addEntry"
          @member-removed="removeEntry"
        />
      </div>
    </div>

    <StatusDisplay :lobby-status="lobby.status" />
    <MemoDisplay
      v-if="lobby.description"
      :text="lobby.description ?? undefined"
    />
    <ScheduleDisplay :lobby="lobby" @stale="fetch" />
    <MemberDisplay :lobby="lobby" @member-removed="removeEntry" />
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
    grid-auto-rows: auto;
    align-items: center;

    gap: 0 var(--space-1);
    padding-left: var(--space-3);
  }

  @media (max-width: 780px) {
    flex-direction: column;
    gap: var(--space-4) 0;

    .description {
      padding-left: 0;
    }

    .action-bar-wrapper {
      align-self: flex-end;
    }
  }
}
</style>
