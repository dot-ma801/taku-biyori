<script setup lang="ts">
import AppHeader from '@/components/layout/AppHeader.vue';
import AppFooter from '@/components/layout/AppFooter.vue';
import BaseToastContainer from '@/components/common/BaseToastContainer/BaseToastContainer.vue';
import BaseLoadingOverlay from '@/components/common/BaseLoadingOverlay/BaseLoadingOverlay.vue';
import { useHideOnScroll } from '@/composables/useHideOnScroll';

// ヘッダーの高さ相当。この位置までは常にヘッダーを見せる
const HEADER_OFFSET = 64;

const { isVisible } = useHideOnScroll({ offset: HEADER_OFFSET });
</script>

<template>
  <div class="app-container">
    <AppHeader class="header" :class="{ 'header--hidden': !isVisible }" />
    <main class="content">
      <router-view />
    </main>
    <AppFooter />
    <BaseToastContainer />
    <BaseLoadingOverlay />
  </div>
</template>

<style scoped>
/*
 * スクロールはページ（body）側に任せる。
 * content を overflow: auto にすると、モバイルのアドレスバー自動収納や
 * スクロール位置の復元といったブラウザ標準の挙動が効かなくなるため。
 */
/*
 * grid ではなく flex にしているのは sticky ヘッダーのため。
 * grid アイテムの containing block は「自分のグリッドエリア」になり、
 * auto 行だとヘッダーの高さと一致して sticky が動く余地がなくなる。
 * flex アイテムなら containing block がコンテナ全体になり、期待どおり追従する。
 */
.app-container {
  min-height: 100dvh;
  background-color: var(--color-background);
  color: var(--color-text);
  display: flex;
  flex-direction: column;
}

/*
 * sticky なのでヘッダーは場所を確保したまま追従する。
 * fixed と違い、コンテンツが下に潜り込まず padding での打ち消しも要らない。
 */
.header {
  position: sticky;
  top: 0;
  z-index: 100;
  transition: transform 0.25s ease;
}

.header--hidden {
  transform: translateY(-100%);
}

@media (prefers-reduced-motion: reduce) {
  .header {
    transition: none;
  }
}

/* 中身が短いページでもフッターが画面下に来るよう、余白ぶんを content が引き受ける */
.content {
  flex: 1;
  padding: var(--space-4);
}
</style>
