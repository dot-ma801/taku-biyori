<script setup lang="ts">
import BaseButton from '@/components/button/BaseButton.vue';
import BaseCard from '@/components/common/BaseCard/BaseCard.vue';
import BaseSectionHeading from '@/components/common/BaseSectionHeading/BaseSectionHeading.vue';
import GameSessionStatusBadge from '@/components/common/GameSessionStatusBadge/GameSessionStatusBadge.vue';
import { GameSessionStatus } from '@taku-biyori/shared';
import type { GameSessionListItemModel } from '@/models/game-session';
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
  mySessions: GameSessionListItemModel[];
}>();

const router = useRouter();

/**
 * 開催が取りうるステータスの並び順（design-v2 §4-2 の4値）。
 * 想定外の値が来ても落とさずに末尾へ送る。
 */
const STATUS_ORDER = new Map<GameSessionStatus, number>([
  [GameSessionStatus.today, 0],
  [GameSessionStatus.scheduled, 1],
  [GameSessionStatus.completed, 2],
  [GameSessionStatus.cancelled, 3],
]);
const UNKNOWN_STATUS_ORDER = Number.MAX_SAFE_INTEGER;

const orderOf = (status: GameSessionStatus) =>
  STATUS_ORDER.get(status) ?? UNKNOWN_STATUS_ORDER;

const INITIAL_VISIBLE_COUNT = 3;
const isExpanded = ref(false);

const formattedMySessions = computed(() =>
  [...props.mySessions]
    // FIXME: これは、バックエンド側でやるべきでは？ > issue を起票したらその番号を付記すること
    .sort((a, b) => orderOf(a.status) - orderOf(b.status))
    .map((item) => ({
      ...item,
      formattedDate: item.scheduledAt,
      formattedTimeLabel: item.timeLabel ?? '',
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
const isEmpty = computed(() => formattedMySessions.value.length === 0);

const onClickOpen = (item: GameSessionListItemModel) => {
  router.push({
    name: 'game-sessions-detail',
    params: { lobbyId: item.lobbyId, gameSessionId: item.id },
  });
};
</script>

<template>
  <BaseCard>
    <BaseSectionHeading class="card-header" level="h3" :icon="Bookmark">
      あなたの開催
    </BaseSectionHeading>

    <p v-if="isEmpty" class="empty-message">まだ参加している開催はありません</p>

    <div v-for="item in visibleSessions" :key="item.id" class="item">
      <div>
        <BaseSectionHeading level="h4">{{ item.title }}</BaseSectionHeading>
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
      <div class="right-area">
        <GameSessionStatusBadge :status="item.status" />
        <BaseButton variant="secondary" @click="onClickOpen(item)">
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
    <button
      v-else-if="hasMore && isExpanded"
      class="expand-button"
      @click="isExpanded = false"
    >
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

.empty-message {
  padding: var(--space-4) 0;
  text-align: center;
  color: var(--color-text-muted);
  font-size: var(--font-size-sm);
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
