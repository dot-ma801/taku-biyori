<script setup lang="ts">
import BaseCard from '@/components/common/BaseCard/BaseCard.vue';
import BaseSectionHeading from '@/components/common/BaseSectionHeading/BaseSectionHeading.vue';
import BaseButton from '@/components/button/BaseButton.vue';
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
</script>

<template>
  <BaseSectionHeading class="card-header" level="h2">
    募集中のセッション
  </BaseSectionHeading>

  <BaseCard v-for="item in formattedPublishSessions">
    <div class="header-area">
      <GameSessionStatusBadge
        class="item1"
        :status="item.status"
      ></GameSessionStatusBadge>
      <BaseSectionHeading class="item2" level="h3">{{
        item.title
      }}</BaseSectionHeading>

      <p class="remaining">
        残り
        <span class="remaining-member-number">
          {{ item.formattedRemainingMembers }}
        </span>
        枠
      </p>
    </div>

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
    <BaseButton>参加する</BaseButton>
  </BaseCard>
</template>

<style scoped>
.header-area {
  display: grid;
  grid-template-columns: 1fr auto;
  grid-template-rows: auto auto;
  gap: var(--space-2);

  .item1 {
    grid-column: 1/2;
    grid-row: 1/2;
    justify-self: start;
  }
  .item2 {
    grid-column: 1/2;
    grid-row: 2/3;
  }
  .remaining {
    grid-column: 2/3;
    grid-row: 1/3;
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
