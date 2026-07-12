<script setup lang="ts">
import BaseCard from '@/components/common/BaseCard/BaseCard.vue';
import BaseSectionHeading from '@/components/common/BaseSectionHeading/BaseSectionHeading.vue';
import BaseTextBox from '@/components/form/BaseTextBox/BaseTextBox.vue';
import BaseTextArea from '@/components/form/BaseTextArea/BaseTextArea.vue';
import { getMaxMembersError } from '@/features/Lobby/Edit/composables/maxMembersValidation';
import { NotebookPen, BookOpenText } from '@lucide/vue';

const title = defineModel<string>('title', { default: '' });
const description = defineModel<string>('description', { default: '' });
const location = defineModel<string>('location', { default: '' });
const maxMembers = defineModel<string>('maxMembers', { default: '' });
const scenarioName = defineModel<string>('scenarioName', { default: '' });

const maxMembersRules = [
  (v: unknown) => getMaxMembersError(v as string) ?? true,
];
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

        <BaseTextArea
          v-model="description"
          label="説明"
          placeholder="共有事項や注意事項、事前準備してほしいことなど…"
        ></BaseTextArea>

        <div class="flex">
          <BaseTextBox
            v-model="location"
            label="開催場所"
            type="text"
            placeholder="例：ココフォリア"
          ></BaseTextBox>

          <BaseTextBox
            v-model="maxMembers"
            label="募集人数（自分を含めて）"
            :type="'number'"
            min="2"
            max="20"
            :rules="maxMembersRules"
          ></BaseTextBox>
        </div>

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

.flex {
  display: flex;
  gap: var(--space-2);

  > * {
    flex: 1;
  }
}
</style>
