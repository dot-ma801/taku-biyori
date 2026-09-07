<script setup lang="ts">
import BaseCard from '@/components/common/BaseCard/BaseCard.vue';
import BaseSectionHeading from '@/components/common/BaseSectionHeading/BaseSectionHeading.vue';
import BaseTextBox from '@/components/form/BaseTextBox/BaseTextBox.vue';
import { NotebookPen, BookOpenText } from '@lucide/vue';
import { computed } from 'vue';

/**
 * 呼び名とシナリオ名は**この開催だけの上書き**。
 * 空欄なら保存時に `null` を送り、ロビーの値に追随する（design-v2 §5-5）。
 * 何が既定値かはプレースホルダで示す。
 */
const props = defineProps<{
  lobbyDefaults?: {
    title: string;
    scenarioName: string | null;
    location: string | null;
  } | null;
}>();

const title = defineModel<string>('title', { default: '' });
const scenarioName = defineModel<string>('scenarioName', { default: '' });

const titlePlaceholder = computed(() =>
  props.lobbyDefaults ? `未入力なら「${props.lobbyDefaults.title}」` : '',
);
const scenarioPlaceholder = computed(() =>
  props.lobbyDefaults?.scenarioName
    ? `未入力なら「${props.lobbyDefaults.scenarioName}」`
    : '',
);
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
          label="この開催の呼び名"
          :placeholder="titlePlaceholder"
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
            :placeholder="scenarioPlaceholder"
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
    margin: var(--space-6) 0;

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
  padding: var(--space-6);
  > * {
    margin: var(--space-6) 0;

    &:first-child {
      margin-top: 0;
    }
    &:last-child {
      margin-bottom: 0;
    }
  }
}
</style>
