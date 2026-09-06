<script setup lang="ts">
import { computed } from 'vue';
import { CalendarDays, Clock, MapPin } from '@lucide/vue';
import BaseBadge from '@/components/common/BaseBadge/BaseBadge.vue';
import type { LobbyDetailModel } from '@/models/lobby';
import type { GameSessionDetailModel } from '@/models/game-session';
import type { TableCardStatus } from '@/features/Table/tableCardStatus';
import {
  TABLE_CARD_STATUS_LABEL,
  TABLE_CARD_STATUS_TONE,
} from '@/features/Table/tableCardStatus';
import { TABLE_ROLE_LABEL, TableRole } from '@/features/Table/Detail/tableRole';

const props = defineProps<{
  lobby: LobbyDetailModel;
  gameSession: GameSessionDetailModel | null;
  status: TableCardStatus | null;
  role: TableRole;
}>();

const statusLabel = computed(() =>
  props.status === null ? null : TABLE_CARD_STATUS_LABEL[props.status],
);
const statusTone = computed(() =>
  props.status === null ? 'default' : TABLE_CARD_STATUS_TONE[props.status],
);
const roleLabel = computed(() => TABLE_ROLE_LABEL[props.role]);
const roleTone = computed(() =>
  props.role === TableRole.host ? 'warning' : 'primary',
);
// ゲストには立場のバッジを出さない。「あなたはゲストです」は伝える価値が薄い
const showRoleBadge = computed(() => props.role !== TableRole.guest);

// 開催が決まっている卓だけ日時を出す。決まる前は出す値が無い
const title = computed(() => props.gameSession?.title ?? props.lobby.title);
const scheduledAt = computed(() => props.gameSession?.scheduledAt ?? null);
const timeLabel = computed(() => props.gameSession?.timeLabel ?? null);
const location = computed(
  () => props.gameSession?.location ?? props.lobby.location,
);
const hasMeta = computed(
  () =>
    scheduledAt.value !== null ||
    timeLabel.value !== null ||
    location.value !== null,
);
</script>

<template>
  <header class="table-header">
    <div class="table-header__badges">
      <BaseBadge v-if="statusLabel" :variant="statusTone">
        {{ statusLabel }}
      </BaseBadge>
      <BaseBadge v-if="showRoleBadge" :variant="roleTone">
        {{ roleLabel }}
      </BaseBadge>
    </div>

    <h1 class="table-header__title">{{ title }}</h1>

    <div v-if="hasMeta" class="table-header__meta">
      <span v-if="scheduledAt" class="table-header__meta-item">
        <CalendarDays :size="15" aria-hidden="true" />
        {{ scheduledAt }}
      </span>
      <span v-if="timeLabel" class="table-header__meta-item">
        <Clock :size="15" aria-hidden="true" />
        {{ timeLabel }}
      </span>
      <span v-if="location" class="table-header__meta-item">
        <MapPin :size="15" aria-hidden="true" />
        {{ location }}
      </span>
    </div>
  </header>
</template>

<style scoped>
.table-header {
  display: flex;
  flex-direction: column;
  gap: var(--space-2);
  min-width: 0;
}

.table-header__badges {
  display: flex;
  align-items: center;
  gap: var(--space-2);
  flex-wrap: wrap;
}

.table-header__title {
  margin: 0;
  font: var(--text-h1);
  color: var(--text-primary);
}

.table-header__meta {
  display: flex;
  flex-wrap: wrap;
  gap: var(--space-2) var(--space-4);
}

.table-header__meta-item {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  font: var(--text-body-sm);
  color: var(--text-secondary);
}
</style>
