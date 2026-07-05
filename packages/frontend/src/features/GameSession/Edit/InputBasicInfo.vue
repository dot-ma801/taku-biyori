<script setup lang="ts">
import BaseCard from '@/components/common/BaseCard/BaseCard.vue';
import BaseSectionHeading from '@/components/common/BaseSectionHeading/BaseSectionHeading.vue';
import BaseTextBox from '@/components/form/BaseTextBox/BaseTextBox.vue';
import { NotebookPen, BookOpenText } from '@lucide/vue';

const title = defineModel<string>('title', { default: '' });
const scenarioName = defineModel<string>('scenarioName', { default: '' });
const maxMembers = defineModel<string>('maxMembers', { default: '' });
</script>

<template>
  <BaseCard>
    <template #header>
      <BaseSectionHeading level="h2" :icon="NotebookPen">
        基本情報
      </BaseSectionHeading>
    </template>

    <template #default>
      <div class="contents">
        <BaseTextBox
          v-model="title"
          label="タイトル"
          placeholder="例：【5月】定期開催マダミス会"
          required
        ></BaseTextBox>
        <BaseTextBox
          v-model="maxMembers"
          label="募集人数（自分を含めて）"
          :type="'number'"
          min="2"
        ></BaseTextBox>

        <div class="scenario-info">
          <BaseSectionHeading
            level="h5"
            :icon="BookOpenText"
            :icon-color="'default'"
          >
            シナリオ情報
          </BaseSectionHeading>
          <BaseTextBox
            v-model="scenarioName"
            label="シナリオタイトル"
          ></BaseTextBox>

          <!-- TODO: Ph2 シナリオ管理機能の実装時に結合する
          <BaseTextArea
            label="シナリオ説明"
            placeholder="シナリオのあらすじなどを記入してください"
          ></BaseTextArea>
          -->
        </div>
      </div>
    </template>
  </BaseCard>
</template>

<style scoped>
.contents {
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

.scenario-info {
  /* 枠線 */
  border: 1px dashed var(--color-border-strong);
  border-radius: var(--space-1);

  /* 色 */
  background-color: var(--color-background);

  /* 余白 */
  padding: var(--space-5);
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
