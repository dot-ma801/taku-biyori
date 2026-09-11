<script setup lang="ts">
import { computed } from 'vue';
import BaseAlert from '@/components/common/BaseAlert/BaseAlert.vue';
import BaseCard from '@/components/common/BaseCard/BaseCard.vue';
import BaseSkeleton from '@/components/common/BaseSkeleton/BaseSkeleton.vue';
import GameSessionCard from '@/features/GameSession/GameSessionCard.vue';
import { useGameSessionCards } from '@/features/GameSession/useGameSessionCards';

/**
 * 終えた卓。ダッシュボードの「終えた卓 N 件をマイページで見る」の着地点（#151）。
 *
 * 一覧には出さず、履歴としてここだけに置く。
 */
const { finishedCards, loading, errorMessage } = useGameSessionCards();

const isEmpty = computed(() => finishedCards.value.length === 0);
</script>

<template>
  <section class="completed">
    <h2 class="completed__title">終えた卓</h2>

    <!-- 取得中・失敗を空と区別する。どちらも「まだありません」と出すと、
         読み込み待ちや通信エラーが「履歴が無い」に見えてしまう -->
    <BaseAlert v-if="errorMessage" variant="error">
      {{ errorMessage }}
    </BaseAlert>

    <BaseCard v-else-if="loading">
      <BaseSkeleton :lines="3" height="16px" />
    </BaseCard>

    <BaseCard v-else-if="isEmpty">
      <p class="completed__empty">
        終えた卓はまだありません。開催が終わると、ここに残ります
      </p>
    </BaseCard>

    <div v-else class="completed__list">
      <GameSessionCard
        v-for="card in finishedCards"
        :key="card.lobbyId"
        :card="card"
      />
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
