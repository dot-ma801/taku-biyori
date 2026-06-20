<script setup lang="ts">
import GameSessionEdit from '@/features/GameSession/Edit/index.vue';
import { useUpdateGameSession } from '@/features/GameSession/Edit/useUpdateGameSession';

const props = defineProps<{ gameSessionId: string }>();

const {
  isScheduled,
  title,
  scenarioName,
  maxMembers,
  description,
  openUntil,
  scheduledAt,
  location,
  loading,
  errorMessage,
  submit,
  cancel,
} = useUpdateGameSession(props.gameSessionId);
</script>

<template>
  <GameSessionEdit
    heading="セッション編集"
    submit-label="セッションを更新する"
    :game-session-id="props.gameSessionId"
    :is-scheduled="isScheduled"
    v-model:title="title"
    v-model:scenarioName="scenarioName"
    v-model:maxMembers="maxMembers"
    v-model:description="description"
    v-model:openUntil="openUntil"
    v-model:scheduledAt="scheduledAt"
    v-model:location="location"
    :loading="loading"
    :error-message="errorMessage"
    @submit="submit"
    @cancel="cancel"
  ></GameSessionEdit>
</template>

<style scoped></style>
