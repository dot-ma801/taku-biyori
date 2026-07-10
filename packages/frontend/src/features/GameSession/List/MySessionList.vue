<script setup lang="ts">
import BaseButton from '@/components/button/BaseButton.vue';
import GameSessionStatusBadge from '@/components/common/GameSessionStatusBadge/GameSessionStatusBadge.vue';
import EmptyState from '@/components/common/EmptyState/EmptyState.vue';
import { GameSessionStatus } from '@taku-biyori/shared';
import type { GameSessionListItem } from '@taku-biyori/shared';
import {
  Bookmark,
  Calendar,
  ChevronDown,
  ChevronUp,
  UsersRound,
} from '@lucide/vue';
import { computed, ref } from 'vue';
import { useRouter } from 'vue-router';

const props = defineProps<{
  mySessions: GameSessionListItem[];
}>();

const router = useRouter();

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
  [...props.mySessions]
    .sort((a, b) => STATUS_ORDER[a.status] - STATUS_ORDER[b.status])
    .map((item) => ({
      ...item,
      formattedDate: item.scheduledAt ?? '日程調整中',
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
const hasSessions = computed(() => formattedMySessions.value.length > 0);

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
  <section class="my-list">
    <header class="my-list__header">
      <div class="my-list__title-row">
        <span class="my-list__icon">
          <Bookmark :size="18" />
        </span>
        <h2 class="my-list__title">あなたの卓</h2>
      </div>
      <p class="my-list__subtitle">参加中・作成中のセッションが並びます。</p>
    </header>

    <template v-if="hasSessions">
      <ul class="my-list__items">
        <li
          v-for="item in visibleSessions"
          :key="item.id"
          class="my-list__item"
        >
          <div class="my-list__item-main">
            <GameSessionStatusBadge :status="item.status" />
            <h3 class="my-list__item-title">{{ item.title }}</h3>
            <div class="my-list__meta">
              <span class="my-list__meta-item">
                <Calendar :size="14" />
                {{ item.formattedDate }}
              </span>
              <span class="my-list__meta-item">
                <UsersRound :size="14" />
                {{ item.memberCount }}/{{ item.formattedMaxMembers }}
              </span>
            </div>
          </div>
          <BaseButton variant="ghost" size="sm" @click="onClickOpen(item.id)">
            開く
          </BaseButton>
        </li>
      </ul>

      <button
        v-if="hasMore && !isExpanded"
        class="my-list__expand"
        type="button"
        @click="isExpanded = true"
      >
        <ChevronDown :size="16" />
        あと {{ hiddenCount }} 件みる
      </button>
      <button
        v-else-if="hasMore && isExpanded"
        class="my-list__expand"
        type="button"
        @click="isExpanded = false"
      >
        <ChevronUp :size="16" />
        閉じる
      </button>
    </template>

    <EmptyState
      v-else
      :icon="Bookmark"
      title="まだ参加中の卓はありません"
      description="新しく卓を立てるか、募集中の卓に参加してみましょう。"
    />
  </section>
</template>

<style scoped>
.my-list {
  background: var(--surface-card);
  border: 1px solid var(--border-subtle);
  border-radius: var(--radius-md);
  box-shadow: var(--shadow-xs);
  padding: var(--space-5);
}

.my-list__header {
  padding-bottom: var(--space-4);
  border-bottom: 1px solid var(--border-subtle);
  margin-bottom: var(--space-2);
}

.my-list__title-row {
  display: flex;
  align-items: center;
  gap: var(--space-2);
}

.my-list__icon {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 32px;
  height: 32px;
  border-radius: var(--radius-full);
  background: var(--brand-primary-soft);
  color: var(--brand-primary);
}

.my-list__title {
  margin: 0;
  font: var(--weight-medium) var(--text-xl) / var(--leading-snug)
    var(--font-display);
  color: var(--text-primary);
}

.my-list__subtitle {
  margin: var(--space-1) 0 0 calc(32px + var(--space-2));
  color: var(--text-secondary);
  font-size: var(--text-sm);
}

.my-list__items {
  list-style: none;
  padding: 0;
  margin: 0;
}

.my-list__item {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: var(--space-3);
  padding: var(--space-4) var(--space-1);
  border-bottom: 1px solid var(--border-subtle);
}

.my-list__item:last-child {
  border-bottom: none;
}

.my-list__item-main {
  min-width: 0;
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: var(--space-1);
}

.my-list__item-title {
  margin: 0;
  font: var(--weight-medium) var(--text-lg) / var(--leading-snug)
    var(--font-display);
  color: var(--text-primary);
}

.my-list__meta {
  display: flex;
  gap: var(--space-3);
  color: var(--text-tertiary);
  font-size: var(--text-xs);
}

.my-list__meta-item {
  display: inline-flex;
  align-items: center;
  gap: var(--space-1);
}

.my-list__expand {
  width: 100%;
  padding: var(--space-3);
  background: none;
  border: none;
  cursor: pointer;
  color: var(--text-secondary);
  font-size: var(--text-sm);
  font-family: inherit;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: var(--space-1);
  border-radius: var(--radius-md);
  transition:
    background var(--duration-fast) var(--ease-standard),
    color var(--duration-fast) var(--ease-standard);
}
.my-list__expand:hover {
  background: var(--surface-card-sunk);
  color: var(--text-primary);
}
</style>
