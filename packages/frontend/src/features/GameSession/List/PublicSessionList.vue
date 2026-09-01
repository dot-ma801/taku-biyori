<script setup lang="ts">
import BaseCard from '@/components/common/BaseCard/BaseCard.vue';
import BaseSectionHeading from '@/components/common/BaseSectionHeading/BaseSectionHeading.vue';
import GameSessionStatusBadge from '@/components/common/GameSessionStatusBadge/GameSessionStatusBadge.vue';
import { Calendar, UsersRound } from '@lucide/vue';
import type { GameSessionListItemModel } from '@/models/game-session';
import { computed } from 'vue';

const props = defineProps<{
  publicSessions: GameSessionListItemModel[];
}>();

const formattedPublishSessions = computed(() => {
  return [...props.publicSessions].map((item) => ({
    ...item,
    formattedDate: item.scheduledAt,
    formattedTimeLabel: item.timeLabel ?? '',
  }));
});

// 定員はロビーの関心事になり、一覧の契約からは外れた（design-v2 §6-11）。
// 残枠を出したい画面はロビーの一覧を見る
const sessionLink = (item: { id: string; lobbyId: string; title: string }) => ({
  to: {
    name: 'game-sessions-detail',
    params: { lobbyId: item.lobbyId, gameSessionId: item.id },
  },
  label: `${item.title} の詳細を見る`,
});
</script>

<template>
  <BaseSectionHeading class="card-header" level="h2">
    公開中の開催
  </BaseSectionHeading>

  <BaseCard
    v-for="item in formattedPublishSessions"
    :key="item.id"
    :link="sessionLink(item)"
  >
    <div class="header-area">
      <div class="header-main">
        <GameSessionStatusBadge
          class="status-badge"
          :status="item.status"
        ></GameSessionStatusBadge>
        <BaseSectionHeading level="h3">{{ item.title }}</BaseSectionHeading>
      </div>
    </div>

    <div class="content-area">
      <div class="session-meta">
        <span class="meta-group">
          <Calendar :size="16" />
          <p>{{ item.formattedDate }}</p>
        </span>
        <span v-if="item.formattedTimeLabel" class="meta-group">
          <p>{{ item.formattedTimeLabel }}</p>
        </span>
        <span class="meta-group">
          <UsersRound :size="16" />
          <p>{{ item.seatCount }}人</p>
        </span>
      </div>
    </div>
  </BaseCard>
</template>

<style scoped>
.header-area {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: var(--space-2);

  margin-bottom: var(--space-2);
}

.header-main {
  display: flex;
  flex-direction: column;
  align-items: flex-start;
  gap: var(--space-1);
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
