<script setup lang="ts">
import GameSessionEdit from '@/features/GameSession/Edit/index.vue';
import { useCreateGameSession } from '@/features/GameSession/Edit/useCreateGameSession';

const {
  title,
  scenarioName,
  maxMembers,
  description,
  openUntil,
  loading,
  errorMessage,
  submit,
  cancel,
} = useCreateGameSession();
</script>

<template>
  <GameSessionEdit
    heading="セッション新規作成"
    submit-label="セッションを作成する"
    v-model:title="title"
    v-model:scenarioName="scenarioName"
    v-model:maxMembers="maxMembers"
    v-model:description="description"
    v-model:openUntil="openUntil"
    :loading="loading"
    :error-message="errorMessage"
    @submit="submit"
    @cancel="cancel"
  ></GameSessionEdit>
</template>

<style scoped></style>
