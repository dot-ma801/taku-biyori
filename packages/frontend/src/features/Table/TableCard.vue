<script setup lang="ts">
import { computed } from 'vue';
import { BookOpen, UsersRound } from '@lucide/vue';
import BaseBadge from '@/components/common/BaseBadge/BaseBadge.vue';
import BaseCard from '@/components/common/BaseCard/BaseCard.vue';
import type { TableCardModel } from '@/features/Table/toTableCards';
import {
  TABLE_CARD_STATUS_LABEL,
  TABLE_CARD_STATUS_TONE,
} from '@/features/Table/tableCardStatus';

const props = defineProps<{
  card: TableCardModel;
}>();

const statusLabel = computed(() => TABLE_CARD_STATUS_LABEL[props.card.status]);
const statusTone = computed(() => TABLE_CARD_STATUS_TONE[props.card.status]);

// 表示用のフォールバック文言は UI の関心事なのでここで解決する
const scenarioName = computed(() => props.card.scenarioName ?? 'シナリオ未定');
const memberLabel = computed(
  () => `${props.card.memberCount} / ${props.card.maxPlayers ?? '-'} 人`,
);
const remainingLabel = computed(() =>
  props.card.remainingCount === null
    ? null
    : `残り ${props.card.remainingCount} 枠`,
);

const link = computed(() => ({
  to: { name: 'lobbies-detail', params: { lobbyId: props.card.lobbyId } },
  label: `${props.card.title} を開く`,
}));
</script>

<template>
  <BaseCard hoverable :link="link">
    <div class="table-card">
      <div class="table-card__badges">
        <BaseBadge :variant="statusTone">{{ statusLabel }}</BaseBadge>
        <BaseBadge v-if="card.isHost" variant="primary">GM</BaseBadge>
      </div>

      <div class="table-card__main">
        <span class="table-card__title">{{ card.title }}</span>
        <span class="table-card__scenario">
          <BookOpen :size="15" aria-hidden="true" />
          {{ scenarioName }}
        </span>
      </div>

      <div class="table-card__footer">
        <span class="table-card__members">
          <UsersRound :size="15" aria-hidden="true" />
          {{ memberLabel }}
        </span>
        <span v-if="remainingLabel" class="table-card__remaining">
          {{ remainingLabel }}
        </span>
      </div>
    </div>
  </BaseCard>
</template>

<style scoped>
.table-card {
  display: flex;
  flex-direction: column;
  gap: var(--space-3);
}

.table-card__badges {
  display: flex;
  align-items: center;
  gap: var(--space-2);
  flex-wrap: wrap;
}

.table-card__main {
  display: flex;
  flex-direction: column;
  gap: var(--space-1);
  min-width: 0;
}

.table-card__title {
  font: var(--text-h3);
  color: var(--text-primary);
}

.table-card__scenario {
  display: flex;
  align-items: center;
  gap: 6px;
  font: var(--text-body-sm);
  color: var(--text-secondary);
}

.table-card__footer {
  display: flex;
  align-items: center;
  gap: var(--space-3);
  padding-top: var(--space-3);
  border-top: var(--border-width) solid var(--border-subtle);
}

.table-card__members {
  display: flex;
  align-items: center;
  gap: 6px;
  font: var(--text-caption);
  color: var(--text-tertiary);
}

.table-card__remaining {
  margin-left: auto;
  font: var(--text-caption);
  color: var(--primary);
  font-weight: var(--weight-semibold);
}
</style>
