<script setup lang="ts">
import { computed } from 'vue';
import BaseCard from '@/components/common/BaseCard/BaseCard.vue';
import type { LobbyDetailModel } from '@/models/lobby';
import type { GameSessionDetailModel } from '@/models/game-session';

const props = defineProps<{
  lobby: LobbyDetailModel;
  gameSession: GameSessionDetailModel | null;
  activeEntryCount: number;
}>();

// 表示用のフォールバック文言は UI の関心事なのでここで解決する
const UNSET = '未設定';

const facts = computed(() => [
  {
    label: 'シナリオ',
    value: props.gameSession?.scenarioName ?? props.lobby.scenarioName ?? UNSET,
  },
  {
    label: '場所',
    value: props.gameSession?.location ?? props.lobby.location ?? UNSET,
  },
  {
    label: '参加人数',
    value: `${props.activeEntryCount} / ${props.lobby.maxPlayers ?? '-'} 人`,
  },
  {
    label: '開催日',
    value: props.gameSession?.scheduledAt ?? UNSET,
  },
  {
    label: '時間帯',
    value: props.gameSession?.timeLabel ?? UNSET,
  },
  {
    label: '受付の締め切り',
    value: props.lobby.openUntil ?? UNSET,
  },
]);

// 当日の連絡事項は開催側、卓そのものの説明はロビー側が持つ
const description = computed(
  () => props.gameSession?.description ?? props.lobby.description,
);
</script>

<template>
  <div class="overview">
    <BaseCard title="卓の情報">
      <dl class="overview__facts">
        <div v-for="fact in facts" :key="fact.label" class="overview__fact">
          <dt class="overview__fact-label">{{ fact.label }}</dt>
          <dd class="overview__fact-value">{{ fact.value }}</dd>
        </div>
      </dl>
    </BaseCard>

    <BaseCard v-if="description" title="説明・当日の連絡事項">
      <p class="overview__description">{{ description }}</p>
    </BaseCard>
  </div>
</template>

<style scoped>
.overview {
  display: flex;
  flex-direction: column;
  gap: var(--space-4);
}

.overview__facts {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(min(14em, 100%), 1fr));
  gap: var(--space-3) var(--space-6);
  margin: 0;
}

.overview__fact {
  display: flex;
  flex-direction: column;
  gap: 3px;
  min-width: 0;
}

.overview__fact-label {
  font: var(--text-caption);
  color: var(--text-tertiary);
}

.overview__fact-value {
  margin: 0;
  font: var(--text-body);
  color: var(--text-primary);
}

.overview__description {
  margin: 0;
  white-space: pre-wrap;
  font: var(--text-body);
  color: var(--text-secondary);
}
</style>
