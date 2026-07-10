<script setup lang="ts">
import BaseCard from '@/components/common/BaseCard/BaseCard.vue';
import { Megaphone, UserRound, CalendarCheck } from '@lucide/vue';
</script>

<template>
  <section class="section">
    <header class="section__header">
      <p class="section__eyebrow">できること</p>
      <h2 class="section__title">卓のまわりを、まるっと支えます</h2>
    </header>

    <div class="cards">
      <BaseCard class="feature-card">
        <div class="feature-card__icon feature-card__icon--sun">
          <Megaphone :size="24" />
        </div>
        <h3 class="feature-card__title">メンバー募集</h3>
        <p class="feature-card__body">
          セッションを作成して公開すれば、仲間に参加してもらえます。<br />共有リンクなら参加者はログイン不要です。
        </p>
      </BaseCard>

      <BaseCard class="feature-card">
        <div class="feature-card__icon feature-card__icon--sora">
          <CalendarCheck :size="24" />
        </div>
        <h3 class="feature-card__title">日程調整</h3>
        <p class="feature-card__body">
          ○△×で気軽に答えて、全員参加できる日をひとめで見つけられます。
        </p>
      </BaseCard>

      <BaseCard class="feature-card">
        <div class="feature-card__icon feature-card__icon--moss">
          <UserRound :size="24" />
        </div>
        <h3 class="feature-card__title">ゲスト参加</h3>
        <p class="feature-card__body">
          共有 URL
          を踏むだけで参加。アカウント登録なしでも、日程回答や卓への合流ができます。
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
  font: var(--type-label);
  color: var(--brand-primary);
  letter-spacing: var(--tracking-wide);
  margin: 0 0 var(--space-1);
}

.section__title {
  margin: 0;
  font: var(--weight-bold) var(--text-2xl) / var(--leading-tight)
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
  color: white;
}

.feature-card__icon--sun {
  background: var(--sun-400);
}
.feature-card__icon--sora {
  background: var(--sora-400);
}
.feature-card__icon--moss {
  background: var(--moss-400);
}

.feature-card__title {
  margin: 0;
  font: var(--weight-medium) var(--text-lg) / var(--leading-snug)
    var(--font-display);
  color: var(--text-primary);
}

.feature-card__body {
  margin: 0;
  color: var(--text-secondary);
  line-height: var(--leading-normal);
}
</style>
