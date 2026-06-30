<script setup lang="ts">
defineOptions({ name: 'LandingPage' });
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
  <div class="container">
    <BaseBadge variant="primary">TRPG / マダミス / ボードゲーム</BaseBadge>
    <h1>卓のことを、ぜんぶまとめて</h1>

    <div class="description">
      <p>シナリオ、日程調整、メンバー、当日メモ…。</p>
      <p>卓びよりは、卓にまつわる情報をまとめて置ける場所を目指しています。</p>
      <p>テーブルトークゲームプレイヤーのための、セッション管理ツール。</p>
    </div>

    <div class="button-area">
      <BaseButton
        size="lg"
        :left-icon="Plus"
        variant="primary"
        @click="onClickCreate"
        >卓を立てる</BaseButton
      >
      <BaseButton
        size="lg"
        :left-icon="UserPlus2"
        variant="secondary"
        @click="onClickToList"
      >
        募集中の卓を見る
      </BaseButton>
    </div>

    <p class="caution">
      ＊ 卓の作成にはアカウント登録 / 参加だけならアカウント不要
    </p>
  </div>
</template>

<style scoped>
.container {
  line-height: 2;
}

.description {
  margin: var(--space-4) 0;
  > p {
    color: var(--color-text-muted);
  }
}

.button-area {
  display: flex;
  gap: var(--space-3);
}

.caution {
  color: var(--color-text-muted);
  font-size: var(--font-size-sm);
  margin: var(--space-2) 0;
}
</style>
