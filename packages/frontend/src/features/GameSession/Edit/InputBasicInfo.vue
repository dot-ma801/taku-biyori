<script setup lang="ts">
import BaseCard from '@/components/common/BaseCard/BaseCard.vue';
import BaseSectionHeading from '@/components/common/BaseSectionHeading/BaseSectionHeading.vue';
import BaseTextArea from '@/components/form/BaseTextArea/BaseTextArea.vue';
import BaseTextBox from '@/components/form/BaseTextBox/BaseTextBox.vue';
import { NotebookPen, BookOpenText } from '@lucide/vue';
</script>

<template>
  <BaseCard>
    <template #header>
      <BaseSectionHeading level="h2" :icon="NotebookPen">
        基本情報
      </BaseSectionHeading>
    </template>

    <template #default>
      <BaseTextBox label="タイトル" placeholder="例：【5月】定期開催マダミス会"></BaseTextBox>

      <div class="scenario-info">
        <BaseSectionHeading
          level="h5"
          :icon="BookOpenText"
          :icon-color="'default'"
        >
          シナリオ情報
        </BaseSectionHeading>
        <BaseTextBox label="シナリオタイトル"></BaseTextBox>
        <BaseTextBox label="募集人数" :type="'number'" min="0"></BaseTextBox>

        <BaseTextArea
          label="シナリオ説明"
          placeholder="シナリオのあらすじなどを記入してください"
        ></BaseTextArea>
      </div>
    </template>
  </BaseCard>
</template>

<style scoped>
.scenario-info {
  /* 枠線 */
  border: 1px dashed var(--color-border-strong);
  border-radius: var(--space-1);

  /* 色 */
  background-color: var(--color-background);

  /* 余白 */
  padding: var(--space-5);
  margin-top: var(--space-5);
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
