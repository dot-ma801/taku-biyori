<script setup lang="ts">
import BaseCard from '@/components/common/BaseCard/BaseCard.vue';
import BaseSectionHeading from '@/components/common/BaseSectionHeading/BaseSectionHeading.vue';
import { TextAlignStart } from '@lucide/vue';

const props = defineProps<{
  text?: string;
}>();
</script>

<template>
  <BaseCard>
    <BaseSectionHeading level="h3" :icon="TextAlignStart">
      詳細
    </BaseSectionHeading>

    <p class="memo">{{ props.text }}</p>
  </BaseCard>
</template>

<style scoped>
/* 入力時の改行をそのまま見せる。連続スペースも保つため pre-wrap を使う */
.memo {
  white-space: pre-wrap;
  overflow-wrap: anywhere;
}
</style>
