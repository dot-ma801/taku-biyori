<script setup lang="ts">
defineOptions({ name: 'AppDashboard' });
import { computed } from 'vue';
import { ArrowRight, Pencil, Plus, UserRound } from '@lucide/vue';
import { useRouter } from 'vue-router';
import BaseAlert from '@/components/common/BaseAlert/BaseAlert.vue';
import BaseButton from '@/components/button/BaseButton.vue';
import GameSessionCardGrid from '@/features/GameSession/GameSessionCardGrid.vue';
import { useGameSessionCards } from '@/features/GameSession/useGameSessionCards';
import { GameSessionCardStatus } from '@/features/GameSession/gameSessionCardStatus';

const router = useRouter();
const { cardsOf, countBy, draftCards, errorMessage } = useGameSessionCards();

const scheduledCards = cardsOf(GameSessionCardStatus.scheduled);
const adjustingCards = cardsOf(GameSessionCardStatus.adjusting);
// 「終えた卓」はマイページと同じ範囲を数える。完了だけだと、中止した卓しか
// 持っていない人に 0 件と出るのに、リンク先には卓が並ぶ食い違いになる
const completedCount = countBy(GameSessionCardStatus.completed);
const cancelledCount = countBy(GameSessionCardStatus.cancelled);

const hasDrafts = computed(() => draftCards.value.length > 0);
const finishedCount = computed(
  () => completedCount.value + cancelledCount.value,
);
const completedLabel = computed(
  () => `終えた卓 ${finishedCount.value} 件をマイページで見る`,
);

const onClickCreate = () => {
  router.push({ name: 'lobbies-new' });
};

// 下書きも卓カードと同じく卓の詳細へ送る。下書きの詳細には「公開」と「編集」が
// 揃っているので、続きを書くのも公開するのもそこから辿れる
const onClickDraft = (lobbyId: string) => {
  router.push({ name: 'lobbies-detail', params: { lobbyId } });
};

const onClickProfile = () => {
  router.push({ name: 'profile-setting' });
};
</script>

<template>
  <div class="dashboard">
    <div class="dashboard__header">
      <h1 class="dashboard__title">ダッシュボード</h1>
      <BaseButton :left-icon="Plus" @click="onClickCreate">
        卓をつくる
      </BaseButton>
    </div>

    <BaseAlert v-if="errorMessage" variant="error">
      {{ errorMessage }}
    </BaseAlert>

    <!-- 直近に控えている予定がいちばん見たい情報なので先頭に置く -->
    <section class="dashboard__section">
      <h2 class="dashboard__section-title">日程の決まった卓</h2>
      <GameSessionCardGrid
        :cards="scheduledCards"
        empty-message="開催日の決まった卓はまだありません"
      />
    </section>

    <section class="dashboard__section">
      <div class="dashboard__section-header">
        <h2 class="dashboard__section-title">日程を調整中の卓</h2>
        <span class="dashboard__section-note">
          回答が集まったら、開催日を決められます
        </span>
      </div>
      <GameSessionCardGrid
        :cards="adjustingCards"
        empty-message="日程を調整している卓はありません"
      />
    </section>

    <!-- 下書きはここからしか辿れないため、残っているときだけ1行で出す -->
    <div v-if="hasDrafts" class="dashboard__drafts">
      <button
        v-for="card in draftCards"
        :key="card.lobbyId"
        type="button"
        class="dashboard__draft"
        @click="onClickDraft(card.lobbyId)"
      >
        <Pencil :size="15" aria-hidden="true" />
        <span class="dashboard__draft-tag">下書き</span>
        <span class="dashboard__draft-title">{{ card.title }}</span>
        <span class="dashboard__draft-action">下書きを開く</span>
      </button>
    </div>

    <button type="button" class="dashboard__history" @click="onClickProfile">
      <UserRound :size="15" aria-hidden="true" />
      {{ completedLabel }}
      <ArrowRight :size="15" aria-hidden="true" />
    </button>
  </div>
</template>

<style scoped>
.dashboard {
  display: flex;
  flex-direction: column;
  gap: var(--space-10);
}

.dashboard__header {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: var(--space-4);
}

.dashboard__title {
  flex: 1;
  margin: 0;
  font: var(--text-h1);
  color: var(--text-primary);
}

.dashboard__section {
  display: flex;
  flex-direction: column;
  gap: var(--space-3);
}

.dashboard__section-header {
  display: flex;
  flex-wrap: wrap;
  align-items: baseline;
  gap: var(--space-3);
}

.dashboard__section-title {
  margin: 0;
  font: var(--text-h3);
  color: var(--text-primary);
}

.dashboard__section-note {
  font: var(--text-body-sm);
  color: var(--text-secondary);
}

.dashboard__drafts {
  display: flex;
  flex-direction: column;
  gap: var(--space-2);
}

.dashboard__draft {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: var(--space-3);
  padding: 10px 14px;
  border: var(--border-width) dashed var(--border);
  border-radius: var(--radius-sm);
  background: none;
  color: var(--text-primary);
  text-align: left;
  cursor: pointer;
  transition: var(--transition-control);
}
.dashboard__draft:hover {
  background: var(--surface-subtle);
}
.dashboard__draft:focus-visible {
  outline: none;
  box-shadow: var(--focus-ring);
}

.dashboard__draft-tag {
  font: var(--text-caption);
  color: var(--text-tertiary);
}

.dashboard__draft-title {
  flex: 1 1 160px;
  min-width: 0;
  font: var(--text-body-sm);
}

.dashboard__draft-action {
  font: var(--text-caption);
  color: var(--text-link);
}

.dashboard__history {
  display: flex;
  align-items: center;
  gap: var(--space-2);
  padding: 10px 14px;
  border: none;
  border-radius: var(--radius-sm);
  background: none;
  color: var(--text-secondary);
  font: var(--text-body-sm);
  text-align: left;
  cursor: pointer;
  transition: var(--transition-control);
}
.dashboard__history:hover {
  color: var(--text-primary);
  background: var(--surface-subtle);
}
.dashboard__history:focus-visible {
  outline: none;
  box-shadow: var(--focus-ring);
}
</style>
