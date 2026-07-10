<script setup lang="ts">
defineOptions({ name: 'GameSessionList' });
import BaseButton from '@/components/button/BaseButton.vue';
import MySessionList from '@/features/GameSession/List/MySessionList.vue';
import PublicSessionList from '@/features/GameSession/List/PublicSessionList.vue';
import { useGameSessionList } from '@/features/GameSession/List/useGameSessionList';
import { Plus } from '@lucide/vue';
import { useRouter } from 'vue-router';

const router = useRouter();
const { mySessions, publicSessions } = useGameSessionList();

const onClickCreate = () => {
  router.push({ name: 'game-sessions-new' });
};
</script>

<template>
  <div class="page">
    <section class="page__hero">
      <div class="page__hero-inner">
        <div>
          <p class="page__eyebrow">卓一覧</p>
          <h1 class="page__title">今日の卓、みつけましょう</h1>
        </div>
        <BaseButton :left-icon="Plus" @click="onClickCreate">
          新しく卓を立てる
        </BaseButton>
      </div>
    </section>

    <div class="page__body">
      <MySessionList :my-sessions="mySessions" />
      <PublicSessionList :public-sessions="publicSessions" />
    </div>
  </div>
</template>

<style scoped>
.page {
  min-height: 100%;
}

.page__hero {
  background: radial-gradient(
    100% 100% at 50% 0%,
    var(--sun-50) 0%,
    var(--surface-app) 70%
  );
  border-bottom: 1px solid var(--border-subtle);
  padding: var(--space-8) var(--space-4);
}

.page__hero-inner {
  max-width: var(--container-max);
  margin: 0 auto;
  display: flex;
  justify-content: space-between;
  align-items: flex-end;
  gap: var(--space-4);
  flex-wrap: wrap;
}

.page__eyebrow {
  margin: 0 0 var(--space-1);
  font: var(--type-label);
  color: var(--brand-primary);
  letter-spacing: var(--tracking-wide);
}

.page__title {
  margin: 0;
  font: var(--weight-bold) var(--text-3xl) / var(--leading-tight)
    var(--font-display);
  color: var(--text-primary);
}

.page__body {
  max-width: var(--container-max);
  margin: 0 auto;
  padding: var(--space-8) var(--space-4);
  display: flex;
  flex-direction: column;
  gap: var(--space-8);
}

@media (max-width: 640px) {
  .page__title {
    font-size: var(--text-2xl);
  }
  .page__hero-inner {
    align-items: flex-start;
  }
}
</style>
