<script setup lang="ts">
defineOptions({ name: 'LobbyDetail' });

import BaseSectionHeading from '@/components/common/BaseSectionHeading/BaseSectionHeading.vue';
import ActionBar from '@/features/Lobby/Detail/ActionBar.vue';
import StatusDisplay from '@/features/Lobby/Detail/StatusDisplay.vue';
import MemberDisplay from '@/features/Lobby/Detail/MemberDisplay.vue';
import { useGetLobbyDetail } from '@/features/Lobby/Detail/composables/useGetLobbyDetail';
import { computed } from 'vue';
import { Album, UsersRound, CalendarDays } from '@lucide/vue';
import MemoDisplay from '@/features/Lobby/Detail/MemoDisplay.vue';

const props = defineProps<{ lobbyId: string }>();

const {
  lobby,
  loading,
  errorMessage,
  fetch,
  patchLobby,
  addMember,
  removeMember,
  memberCount,
} = useGetLobbyDetail(props.lobbyId);

const scenarioName = computed(() => {
  return lobby.value?.scenarioName ?? '未設定';
});

const gameSessionDateTime = computed(() => {
  return lobby.value?.closedAt ?? '未設定';
});

const maxMembers = computed(() => {
  return lobby.value?.maxPlayers ?? '未設定';
});
</script>

<template>
  <template v-if="lobby">
    <BaseSectionHeading level="h1">
      {{ lobby.title }}
    </BaseSectionHeading>

    <div class="session-meta-bar">
      <div class="description">
        <Album :size="16" />
        <p>シナリオ：{{ scenarioName }}</p>
        <CalendarDays :size="16" />
        <p>日時：{{ gameSessionDateTime }}</p>
        <UsersRound :size="16" />
        <p>募集人数: {{ maxMembers }}</p>
      </div>

      <div class="action-bar-wrapper">
        <ActionBar />
      </div>
    </div>

    <StatusDisplay :lobby-status="lobby.status" />
    <MemoDisplay :text="lobby.description ?? undefined" />
    <MemberDisplay :lobby="lobby" />
  </template>
</template>

<style scoped>
.session-meta-bar {
  display: flex;
  justify-content: space-between;

  .description {
    display: grid;
    grid-template-columns: auto 1fr;
    grid-template-rows: 1fr 1fr;
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
