<script setup lang="ts">
import BaseButton from '@/components/button/BaseButton.vue';
import BaseCard from '@/components/common/BaseCard/BaseCard.vue';
import BaseSectionHeading from '@/components/common/BaseSectionHeading/BaseSectionHeading.vue';
import GameSessionStatusBadge from '@/components/common/GameSessionStatusBadge/GameSessionStatusBadge.vue';
import { useGameSessionList } from '@/features/GameSession/List/useGameSessionList';
import { GameSessionStatus } from '@taku-biyori/shared';
import {
  Bookmark,
  Calendar,
  ChevronDown,
  ChevronUp,
  UsersRound,
} from '@lucide/vue';
import { computed, ref } from 'vue';
import { useRouter } from 'vue-router';

const router = useRouter();
const { mySessions } = useGameSessionList();

const STATUS_ORDER: Record<GameSessionStatus, number> = {
  [GameSessionStatus.today]: 0,
  [GameSessionStatus.confirmed]: 1,
  [GameSessionStatus.scheduling]: 2,
  [GameSessionStatus.open]: 3,
  [GameSessionStatus.draft]: 4,
  [GameSessionStatus.completed]: 5,
};

const INITIAL_VISIBLE_COUNT = 3;
const isExpanded = ref(false);

const formattedMySessions = computed(() =>
  [...mySessions.value]
    // FIXME: これは、バックエンド側でやるべきでは？ > issue を起票したらその番号を付記すること
    .sort((a, b) => STATUS_ORDER[a.status] - STATUS_ORDER[b.status])
    .map((item) => ({
      ...item,
      formattedDate: item.scheduledAt ?? '調整中',
      formattedMaxMembers: item.maxMembers ?? '-',
    })),
);

const visibleSessions = computed(() =>
  isExpanded.value
    ? formattedMySessions.value
    : formattedMySessions.value.slice(0, INITIAL_VISIBLE_COUNT),
);

const hiddenCount = computed(
  () => formattedMySessions.value.length - INITIAL_VISIBLE_COUNT,
);

const hasMore = computed(() => hiddenCount.value > 0);

const onClickOpen = (id: string) => {
  router.push({
    name: 'game-sessions-detail',
    params: {
      gameSessionId: id,
    },
  });
};
</script>

<template>
  <BaseCard>
    <BaseSectionHeading class="card-header" level="h3" :icon="Bookmark">
      あなたのセッション
    </BaseSectionHeading>

    <div v-for="item in visibleSessions" :key="item.id" class="item">
      <div>
        <BaseSectionHeading level="h4">{{ item.title }}</BaseSectionHeading>
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
      <div class="right-area">
        <GameSessionStatusBadge :status="item.status" />
        <BaseButton variant="secondary" @click="onClickOpen(item.id)">
          開く
        </BaseButton>
      </div>
    </div>

    <button
      v-if="hasMore && !isExpanded"
      class="expand-button"
      @click="isExpanded = true"
    >
      <ChevronDown :size="16" />
      更に見る（{{ hiddenCount }}件）
    </button>
    <button v-else class="expand-button" @click="isExpanded = false">
      <ChevronUp :size="16" />
      閉じる
    </button>
  </BaseCard>
</template>

<style scoped>
.card-header {
  padding-bottom: var(--space-3);
  border-bottom: 1px solid var(--color-border);
}

.item {
  display: flex;
  align-items: center;
  justify-content: space-between;

  padding: var(--space-2);

  border-bottom: 1px solid var(--color-border);

  .right-area {
    display: flex;
    align-items: center;
    gap: var(--space-2);
  }
}

.item:last-child {
  border-bottom: none;
}

.expand-button {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: var(--space-1);

  width: 100%;
  padding: var(--space-2);

  background: none;
  border: none;
  cursor: pointer;

  color: var(--color-text-muted);
  font-size: var(--font-size-sm);

  &:hover {
    color: var(--color-text);
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
