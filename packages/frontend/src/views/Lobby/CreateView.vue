<script setup lang="ts">
import LobbyEdit from '@/features/Lobby/Edit/index.vue';
import PageContainer from '@/components/layout/PageContainer/PageContainer.vue';
import { useCreateLobby } from '@/features/Lobby/Edit/composables/useCreateLobby';

const {
  title,
  scenarioName,
  maxMembers,
  description,
  openUntil,
  location,
  pendingDates,
  scheduleMode,
  scheduledAt,
  timeLabel,
  gameSessionDescription,
  loading,
  errorMessages,
  submit,
  cancel,
} = useCreateLobby();
</script>

<template>
  <PageContainer>
    <LobbyEdit
      heading="ロビー新規作成"
      submit-label="ロビーを作成する"
      v-model:title="title"
      v-model:scenarioName="scenarioName"
      v-model:maxMembers="maxMembers"
      v-model:description="description"
      v-model:openUntil="openUntil"
      v-model:location="location"
      v-model:pendingDates="pendingDates"
      v-model:scheduleMode="scheduleMode"
      v-model:scheduledAt="scheduledAt"
      v-model:timeLabel="timeLabel"
      v-model:gameSessionDescription="gameSessionDescription"
      :show-candidate-dates="true"
      :show-schedule-mode-switch="true"
      :loading="loading"
      :error-messages="errorMessages"
      @submit="submit"
      @cancel="cancel"
    ></LobbyEdit>
  </PageContainer>
</template>

<style scoped></style>
