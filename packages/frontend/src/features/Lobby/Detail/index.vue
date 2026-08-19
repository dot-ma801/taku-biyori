<script setup lang="ts">
defineOptions({ name: 'LobbyDetail' });

import BaseSectionHeading from '@/components/common/BaseSectionHeading/BaseSectionHeading.vue';
import ActionBar from '@/features/Lobby/Detail/ActionBar.vue';
import StatusDisplay from '@/features/Lobby/Detail/StatusDisplay.vue';
import ConfirmedNotice from '@/features/Lobby/Detail/ConfirmedNotice.vue';
import MemberDisplay from '@/features/Lobby/Detail/MemberDisplay.vue';
import MemberLinkRequests from '@/features/Lobby/Detail/MemberLinkRequests.vue';
import MemoDisplay from '@/features/Lobby/Detail/MemoDisplay.vue';
import ScheduleDisplay from '@/features/Lobby/Detail/Schedule/ScheduleDisplay.vue';
import { useGetLobbyDetail } from '@/features/Lobby/Detail/composables/useGetLobbyDetail';
import { useLobbyMembership } from '@/features/Lobby/Detail/composables/useLobbyMembership';
import { LobbyStatus } from '@taku-biyori/shared';
import { computed } from 'vue';
import { Album, UsersRound, CalendarDays, MapPin } from '@lucide/vue';

const props = defineProps<{ lobbyId: string }>();

const {
  lobby,
  fetch,
  patchLobby,
  addMember,
  patchMember,
  removeMember,
  memberCount,
} = useGetLobbyDetail(props.lobbyId);

// ホスト判定は membership に集約されているため再利用する
const { isHost } = useLobbyMembership(
  props.lobbyId,
  () => lobby.value,
  () => {},
  () => {},
);

const scenarioName = computed(() => lobby.value?.scenarioName ?? '未設定');

const gameSessionDateTime = computed(() => lobby.value?.closedAt ?? '未設定');

const capacityText = computed(() => {
  const max = lobby.value?.maxPlayers;
  return max != null
    ? `${memberCount.value} / 定員${max}`
    : `${memberCount.value} / 定員未設定`;
});

const location = computed(() => lobby.value?.location ?? '未設定');
const isConfirmed = computed(
  () =>
    lobby.value?.status === LobbyStatus.confirmed &&
    lobby.value.confirmedGameSession != null,
);
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
        <MapPin :size="16" />
        <p>場所：{{ location }}</p>
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
    <ConfirmedNotice v-if="isConfirmed" :lobby="lobby" />
    <MemoDisplay
      v-if="lobby.description"
      :text="lobby.description ?? undefined"
    />
    <ScheduleDisplay :lobby="lobby" @lobby-changed="fetch" />
    <MemberLinkRequests
      :lobby="lobby"
      :is-host="isHost"
      @member-linked="patchMember"
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
