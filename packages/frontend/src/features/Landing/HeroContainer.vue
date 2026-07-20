<script setup lang="ts">
defineOptions({ name: 'LandingPage' });
import BaseBadge from '@/components/common/BaseBadge/BaseBadge.vue';
import BaseButton from '@/components/button/BaseButton.vue';
import { List } from '@lucide/vue';
import { useRouter } from 'vue-router';

const router = useRouter();

const onClickToList = () => {
  router.push({ name: 'dashboard' });
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
        :left-icon="List"
        variant="primary"
        @click="onClickToList"
      >
        一覧画面へ
      </BaseButton>
    </div>
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
