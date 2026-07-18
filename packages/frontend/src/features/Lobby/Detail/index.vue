<script setup lang="ts">
defineOptions({ name: 'LobbyDetail' });

import BaseSectionHeading from '@/components/common/BaseSectionHeading/BaseSectionHeading.vue';
import ActionBar from '@/features/Lobby/Detail/ActionBar.vue';
import StatusDisplay from '@/features/Lobby/Detail/StatusDisplay.vue';
import MemberDisplay from '@/features/Lobby/Detail/MemberDisplay.vue';
import { useGetLobbyDetail } from '@/features/Lobby/Detail/composables/useGetLobbyDetail';
import { computed } from 'vue';
import { Album, UsersRound, CalendarDays, MapPin } from '@lucide/vue';
import MemoDisplay from '@/features/Lobby/Detail/MemoDisplay.vue';

const props = defineProps<{ lobbyId: string }>();

const { lobby, patchLobby, addMember, removeMember, memberCount } =
  useGetLobbyDetail(props.lobbyId);

const scenarioName = computed(() => lobby.value?.scenarioName ?? '未設定');

const gameSessionDateTime = computed(() => lobby.value?.closedAt ?? '未設定');

const capacityText = computed(() => {
  const max = lobby.value?.maxPlayers;
  return max != null
    ? `${memberCount.value} / 定員${max}`
    : `${memberCount.value} / 定員未設定`;
});

const hasLocation = computed(() => !!lobby.value?.location);
const location = computed(() => lobby.value?.location ?? '');
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
        <CalendarDays :size="16" />
        <p>日時：{{ gameSessionDateTime }}</p>
        <UsersRound :size="16" />
        <p>参加者：{{ capacityText }}</p>
        <template v-if="hasLocation">
          <MapPin :size="16" />
          <p>場所：{{ location }}</p>
        </template>
      </div>

      <div class="action-bar-wrapper">
        <ActionBar
          :lobby="lobby"
          @updated="patchLobby"
          @member-added="addMember"
          @member-removed="removeMember"
        />
      </div>
    </div>

    <StatusDisplay :lobby-status="lobby.status" />
    <MemoDisplay
      v-if="lobby.description"
      :text="lobby.description ?? undefined"
    />
    <MemberDisplay :lobby="lobby" @member-removed="removeMember" />
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
