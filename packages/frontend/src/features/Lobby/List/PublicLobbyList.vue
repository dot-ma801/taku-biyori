<script setup lang="ts">
import BaseCard from '@/components/common/BaseCard/BaseCard.vue';
import BaseSectionHeading from '@/components/common/BaseSectionHeading/BaseSectionHeading.vue';
import LobbyStatusBadge from '@/components/common/LobbyStatusBadge/LobbyStatusBadge.vue';
import { UsersRound } from '@lucide/vue';
import type { LobbyListItem } from '@taku-biyori/shared';
import { computed } from 'vue';

const props = defineProps<{
  publicLobbies: LobbyListItem[];
}>();

const formattedPublicLobbies = computed(() => {
  return [...props.publicLobbies].map((item) => ({
    ...item,
    formattedMaxPlayers: item.maxPlayers ?? '-',
    formattedRemainingMembers:
      item.maxPlayers != null ? item.maxPlayers - item.memberCount : null,
  }));
});

const lobbyLink = (item: { id: string; title: string }) => ({
  to: { name: 'lobbies-detail', params: { lobbyId: item.id } },
  label: `${item.title} の詳細を見る`,
});
</script>

<template>
  <BaseSectionHeading class="card-header" level="h2">
    募集中のロビー
  </BaseSectionHeading>

  <BaseCard
    v-for="item in formattedPublicLobbies"
    :key="item.id"
    :link="lobbyLink(item)"
  >
    <div class="header-area">
      <LobbyStatusBadge
        class="status-badge"
        :status="item.status"
      ></LobbyStatusBadge>
      <BaseSectionHeading level="h3">{{ item.title }}</BaseSectionHeading>

      <p v-if="item.formattedRemainingMembers != null" class="remaining">
        残り
        <span class="remaining-member-number">
          {{ item.formattedRemainingMembers }}
        </span>
        枠
      </p>
    </div>

    <div class="content-area">
      <div class="lobby-meta">
        <span class="meta-group">
          <UsersRound :size="16" />
          <p>{{ item.memberCount }}/{{ item.formattedMaxPlayers }}</p>
        </span>
      </div>
    </div>
  </BaseCard>
</template>

<style scoped>
.header-area {
  display: grid;
  grid-template-columns: 1fr auto;
  gap: var(--space-2);

  margin-bottom: var(--space-2);

  .status-badge {
    justify-self: start;
  }
  .remaining {
    grid-column: 2;
    grid-row: 1 / span 2;
  }
}

.remaining {
  color: var(--color-text-muted);
  font-size: var(--font-size-sm);

  .remaining-member-number {
    font-size: var(--font-size-lg);
    color: var(--color-primary-text);
  }
}

.content-area {
  display: flex;
  justify-content: space-between;
}

.lobby-meta {
  display: flex;
  align-items: center;
  gap: var(--space-2);

  color: var(--color-text-muted);
  font-size: var(--font-size-sm);

  .meta-group {
    display: flex;
    align-items: center;
    gap: var(--space-1);
  }
}
</style>
