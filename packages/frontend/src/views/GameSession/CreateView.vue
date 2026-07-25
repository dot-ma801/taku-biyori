<script setup lang="ts">
import GameSessionEdit from '@/features/GameSession/Edit/index.vue';
import PageContainer from '@/components/layout/PageContainer/PageContainer.vue';
import { useCreateGameSession } from '@/features/GameSession/Edit/useCreateGameSession';

const {
  title,
  scenarioName,
  maxMembers,
  description,
  scheduledAt,
  location,
  loading,
  errorMessage,
  submit,
  cancel,
} = useCreateGameSession();
</script>

<template>
  <PageContainer>
    <GameSessionEdit
      heading="セッション新規作成"
      submit-label="セッションを作成する"
      v-model:title="title"
      v-model:scenarioName="scenarioName"
      v-model:maxMembers="maxMembers"
      v-model:description="description"
      v-model:scheduledAt="scheduledAt"
      v-model:location="location"
      :loading="loading"
      :error-message="errorMessage"
      @submit="submit"
      @cancel="cancel"
    ></GameSessionEdit>
  </PageContainer>
</template>

<style scoped></style>
