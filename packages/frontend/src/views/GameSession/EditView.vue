<script setup lang="ts">
import GameSessionEdit from '@/features/GameSession/Edit/index.vue';
import PageContainer from '@/components/layout/PageContainer/PageContainer.vue';
import { useUpdateGameSession } from '@/features/GameSession/Edit/useUpdateGameSession';

const props = defineProps<{ lobbyId: string; gameSessionId: string }>();

const {
  title,
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
</script>

<template>
  <PageContainer>
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

<style scoped></style>
