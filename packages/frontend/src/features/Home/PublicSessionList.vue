<script setup lang="ts">
import BaseCard from '@/components/common/BaseCard/BaseCard.vue';
import BaseSectionHeading from '@/components/common/BaseSectionHeading/BaseSectionHeading.vue';
import GameSessionStatusBadge from '@/components/common/GameSessionStatusBadge/GameSessionStatusBadge.vue';
import { Calendar, UsersRound } from '@lucide/vue';
import { useHomeData } from '@/features/Home/useHomeData';
import { computed } from 'vue';

const { publicSessions } = useHomeData();

const formattedPublishSessions = computed(() => {
  return [...publicSessions.value].map((item) => ({
    ...item,
    formattedDate: item.scheduledAt ?? '調整中',
    formattedMaxMembers: item.maxMembers ?? '-',
    formattedRemainingMembers:
      item.maxMembers != null ? item.maxMembers - item.memberCount : null,
  }));
});

const sessionLink = (item: { id: string; title: string }) => ({
  to: { name: 'game-sessions-detail', params: { gameSessionId: item.id } },
  label: `${item.title} の詳細を見る`,
});
</script>

<template>
  <BaseSectionHeading class="card-header" level="h2">
    募集中のセッション
  </BaseSectionHeading>

  <BaseCard
    v-for="item in formattedPublishSessions"
    :key="item.id"
    :link="sessionLink(item)"
  >
    <div class="header-area">
      <GameSessionStatusBadge
        class="status-badge"
        :status="item.status"
      ></GameSessionStatusBadge>
      <BaseSectionHeading level="h3">{{ item.title }}</BaseSectionHeading>

      <p class="remaining">
        残り
        <span class="remaining-member-number">
          {{ item.formattedRemainingMembers }}
        </span>
        枠
      </p>
    </div>

    <div class="content-area">
      <div class="session-meta">
        <span class="meta-group">
          <Calendar :size="16" />
          <p>{{ item.formattedDate }}</p>
        </span>
        <span class="meta-group">
          <UsersRound :size="16" />
          <p>{{ item.memberCount }}/{{ item.formattedMaxMembers }}</p>
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

.session-meta {
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
