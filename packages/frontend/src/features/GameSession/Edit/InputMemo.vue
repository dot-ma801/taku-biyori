<script setup lang="ts">
import BaseCard from '@/components/common/BaseCard/BaseCard.vue';
import BaseSectionHeading from '@/components/common/BaseSectionHeading/BaseSectionHeading.vue';
import BaseTextArea from '@/components/form/BaseTextArea/BaseTextArea.vue';
import { MessageSquareText } from '@lucide/vue';
</script>

<template>
  <BaseCard>
    <template #header>
      <BaseSectionHeading
        level="h2"
        :icon="MessageSquareText"
        text-color="default"
      >
        詳細文
      </BaseSectionHeading>
    </template>

    <template #default>
      <BaseTextArea
        label="メモ"
        placeholder="共有事項や注意事項、事前準備してほしいことなど…"
      ></BaseTextArea>
    </template>
  </BaseCard>
</template>

<style scoped>
.switch {
  margin-bottom: var(--space-4);
}

.contents {
  /* 余白 */
  > * {
    margin: var(--space-5) 0;

    &:first-child {
      margin-top: 0;
    }
    &:last-child {
      margin-bottom: 0;
    }
  }
}
</style>
