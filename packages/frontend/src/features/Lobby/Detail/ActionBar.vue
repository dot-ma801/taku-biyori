<script setup lang="ts">
import BaseButton from '@/components/button/BaseButton.vue';
import { Share2, SquarePen, Ban, Globe } from '@lucide/vue';
</script>

<template>
  <div class="button-area">
    <BaseButton :left-icon="Globe"> 公開 </BaseButton>
    <BaseButton variant="secondary" :left-icon="SquarePen"> 編集 </BaseButton>
    <BaseButton :left-icon="Share2" variant="secondary">
      招待リンクを取得
    </BaseButton>
    <BaseButton variant="danger" :left-icon="Ban"> 募集中止 </BaseButton>
  </div>
</template>

<style scoped>
.button-area {
  > * {
    margin: 0 var(--space-1);
  }
}
</style>
