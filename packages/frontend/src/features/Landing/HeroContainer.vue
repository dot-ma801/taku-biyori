<script setup lang="ts">
defineOptions({ name: 'LandingHero' });
import BaseBadge from '@/components/common/BaseBadge/BaseBadge.vue';
import BaseButton from '@/components/button/BaseButton.vue';
import { Plus, UserPlus2 } from '@lucide/vue';
import { useRouter } from 'vue-router';

const router = useRouter();

const onClickCreate = () => {
  router.push({
    name: 'login',
    query: { tab: 'signup', 'next-page': 'game-sessions-new' },
  });
};

const onClickToList = () => {
  router.push({ name: 'game-sessions-list' });
};
</script>

<template>
  <section class="hero">
    <div class="hero__inner">
      <BaseBadge variant="primary">TRPG / マダミス / ボードゲーム</BaseBadge>
      <h1 class="hero__title">卓のことを、ぜんぶまとめて。</h1>

      <div class="hero__description">
        <p>シナリオ、日程調整、メンバー、当日メモ…。</p>
        <p>
          <span class="hero__wordmark">たく日和</span
          >は、卓にまつわる情報をひとつの場所に置ける、
        </p>
        <p>テーブルトークゲームプレイヤーのためのセッション管理ツールです。</p>
      </div>

      <div class="hero__actions">
        <BaseButton
          size="lg"
          :left-icon="Plus"
          variant="primary"
          @click="onClickCreate"
        >
          卓を立てる
        </BaseButton>
        <BaseButton
          size="lg"
          :left-icon="UserPlus2"
          variant="secondary"
          @click="onClickToList"
        >
          募集中の卓を見る
        </BaseButton>
      </div>

      <p class="hero__note">
        ＊ 卓の作成にはアカウント登録が必要です。参加だけならアカウントなしで大丈夫。
      </p>
    </div>
  </section>
</template>

<style scoped>
.hero {
  position: relative;
  margin: calc(var(--space-6) * -1) calc(var(--space-4) * -1) var(--space-6);
  padding: var(--space-10) var(--space-4) var(--space-12);
  background:
    radial-gradient(
      120% 100% at 50% 0%,
      var(--sun-50) 0%,
      var(--surface-app) 65%
    );
  border-bottom: 1px solid var(--border-subtle);
  overflow: hidden;
}

.hero__inner {
  max-width: 720px;
  margin: 0 auto;
  text-align: center;
}

.hero__title {
  margin: var(--space-4) 0 var(--space-5);
  font:
    var(--weight-bold) var(--text-4xl) / var(--leading-tight)
    var(--font-display);
  color: var(--text-primary);
  letter-spacing: var(--tracking-tight);
}

.hero__description {
  margin: 0 auto var(--space-6);
  max-width: 560px;
  color: var(--text-secondary);
  line-height: var(--leading-normal);

  > p {
    margin: 0;
  }
}

.hero__wordmark {
  font-family: var(--font-display);
  font-weight: var(--weight-bold);
  color: var(--brand-primary-press);
}

.hero__actions {
  display: flex;
  justify-content: center;
  flex-wrap: wrap;
  gap: var(--space-3);
  margin-top: var(--space-6);
}

.hero__note {
  margin-top: var(--space-4);
  color: var(--text-tertiary);
  font-size: var(--text-xs);
}

@media (max-width: 640px) {
  .hero__title {
    font-size: var(--text-3xl);
  }
  .hero__actions {
    flex-direction: column;
    align-items: stretch;
  }
}
</style>
