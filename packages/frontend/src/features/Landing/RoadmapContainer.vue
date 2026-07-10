<script setup lang="ts">
import BaseCard from '@/components/common/BaseCard/BaseCard.vue';
import { Lightbulb, BookMarked, Drama } from '@lucide/vue';
</script>

<template>
  <section class="section">
    <header class="section__header">
      <p class="section__eyebrow">これからできるようになること</p>
      <h2 class="section__title">これからも、少しずつ育てていきます</h2>
    </header>

    <div class="cards">
      <BaseCard class="feature-card">
        <div class="feature-card__icon">
          <BookMarked :size="24" />
        </div>
        <h3 class="feature-card__title">シナリオ管理</h3>
        <p class="feature-card__body">
          マダミスや TRPG のシナリオを登録して、卓に紐づけて管理できるようにします。
        </p>
      </BaseCard>

      <BaseCard class="feature-card">
        <div class="feature-card__icon">
          <Drama :size="24" />
        </div>
        <h3 class="feature-card__title">キャラクター管理</h3>
        <p class="feature-card__body">
          TRPG やマダミスのキャラクターを登録して、卓ごとに選べるようにします。
        </p>
      </BaseCard>

      <BaseCard class="feature-card">
        <div class="feature-card__icon">
          <Lightbulb :size="24" />
        </div>
        <h3 class="feature-card__title">その他いろいろ？</h3>
        <p class="feature-card__body">
          「こんな機能がほしい！」のリクエストはいつでもお待ちしています。
        </p>
      </BaseCard>
    </div>
  </section>
</template>

<style scoped>
.section__header {
  text-align: center;
  margin-bottom: var(--space-6);
}

.section__eyebrow {
  font: var(--font-label);
  color: var(--brand-secondary);
  letter-spacing: var(--tracking-wide);
  margin: 0 0 var(--space-1);
}

.section__title {
  margin: 0;
  font:
    var(--weight-bold) var(--text-2xl) / var(--leading-tight)
    var(--font-display);
  color: var(--text-primary);
}

.cards {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(260px, 1fr));
  gap: var(--space-4);
}

.feature-card {
  display: flex;
  flex-direction: column;
  gap: var(--space-3);
}

.feature-card__icon {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 44px;
  height: 44px;
  border-radius: var(--radius-full);
  background: var(--washi-100);
  color: var(--text-secondary);
}

.feature-card__title {
  margin: 0;
  font:
    var(--weight-medium) var(--text-lg) / var(--leading-snug)
    var(--font-display);
  color: var(--text-primary);
}

.feature-card__body {
  margin: 0;
  color: var(--text-secondary);
  line-height: var(--leading-normal);
}
</style>
