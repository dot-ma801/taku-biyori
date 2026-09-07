<script setup lang="ts">
import { computed } from 'vue';
import BaseCard from '@/components/common/BaseCard/BaseCard.vue';
import GameSessionCard from '@/features/GameSession/GameSessionCard.vue';
import { useGameSessionCards } from '@/features/GameSession/useGameSessionCards';
import { GameSessionCardStatus } from '@/features/GameSession/gameSessionCardStatus';

/**
 * 終えた卓。ダッシュボードの「終えた卓 N 件をマイページで見る」の着地点（#151）。
 *
 * 一覧には出さず、履歴としてここだけに置く。
 */
const { cardsOf } = useGameSessionCards();

const completed = cardsOf(GameSessionCardStatus.completed);
const cancelled = cardsOf(GameSessionCardStatus.cancelled);

const cards = computed(() => [...completed.value, ...cancelled.value]);
const isEmpty = computed(() => cards.value.length === 0);
</script>

<template>
  <section class="completed">
    <h2 class="completed__title">終えた卓</h2>

    <BaseCard v-if="isEmpty">
      <p class="completed__empty">
        終えた卓はまだありません。開催が終わると、ここに残ります
      </p>
    </BaseCard>

    <div v-else class="completed__list">
      <GameSessionCard v-for="card in cards" :key="card.lobbyId" :card="card" />
    </div>
  </section>
</template>

<style scoped>
.completed {
  display: flex;
  flex-direction: column;
  gap: var(--space-3);
}

.completed__title {
  margin: 0;
  font: var(--text-h3);
  color: var(--text-primary);
}

.completed__list {
  display: flex;
  flex-direction: column;
  gap: var(--space-3);
}

.completed__empty {
  margin: 0;
  font: var(--text-body-sm);
  color: var(--text-secondary);
}
</style>
