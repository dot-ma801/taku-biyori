<script setup lang="ts">
import { computed } from 'vue';
import GameSessionEdit from '@/features/GameSession/Edit/index.vue';
import PageContainer from '@/components/layout/PageContainer/PageContainer.vue';
import BaseBreadcrumb from '@/components/common/BaseBreadcrumb/BaseBreadcrumb.vue';
import { useUpdateGameSession } from '@/features/GameSession/Edit/useUpdateGameSession';

const props = defineProps<{ lobbyId: string; gameSessionId: string }>();

const {
  title,
  savedTitle,
  scenarioName,
  location,
  timeLabel,
  description,
  scheduledAt,
  lobbyDefaults,
  loading,
  errorMessage,
  submit,
  cancel,
} = useUpdateGameSession(props.lobbyId, props.gameSessionId);

// URL を入れ子にしたぶん（design-v2 §7-1）、階層を辿る導線を画面にも置く。
// ラベルは取得時点の値を使う。編集中の下書きを出すと、保存前の文字が
// リンク先の名前として表示されてしまう
const breadcrumbItems = computed(() => [
  { label: 'ダッシュボード', to: { name: 'dashboard' } },
  {
    label: lobbyDefaults.value?.title ?? 'ロビー',
    to: { name: 'lobbies-detail', params: { lobbyId: props.lobbyId } },
  },
  {
    label: savedTitle.value || '開催',
    to: {
      name: 'game-sessions-detail',
      params: {
        lobbyId: props.lobbyId,
        gameSessionId: props.gameSessionId,
      },
    },
  },
  { label: '開催の編集' },
]);
</script>

<template>
  <PageContainer size="sm">
    <BaseBreadcrumb class="breadcrumb" :items="breadcrumbItems" />

    <GameSessionEdit
      heading="開催の編集"
      submit-label="開催を更新する"
      v-model:title="title"
      v-model:scenarioName="scenarioName"
      v-model:description="description"
      v-model:scheduledAt="scheduledAt"
      v-model:location="location"
      v-model:timeLabel="timeLabel"
      :lobby-defaults="lobbyDefaults"
      :loading="loading"
      :error-message="errorMessage"
      @submit="submit"
      @cancel="cancel"
    ></GameSessionEdit>
  </PageContainer>
</template>

<style scoped>
.breadcrumb {
  margin-bottom: var(--space-4);
}
</style>
