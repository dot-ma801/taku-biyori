<script setup lang="ts">
import LobbyEdit from '@/features/Lobby/Edit/index.vue';
import PageContainer from '@/components/layout/PageContainer/PageContainer.vue';
import { useUpdateLobby } from '@/features/Lobby/Edit/composables/useUpdateLobby';

const props = defineProps<{
  lobbyId: string;
}>();

const {
  title,
  scenarioName,
  maxMembers,
  description,
  openUntil,
  location,
  pendingDates,
  loading,
  errorMessage,
  submit,
  cancel,
} = useUpdateLobby(props.lobbyId);
</script>

<template>
  <PageContainer>
    <LobbyEdit
      heading="ロビー編集"
      submit-label="ロビーを更新する"
      v-model:title="title"
      v-model:scenarioName="scenarioName"
      v-model:maxMembers="maxMembers"
      v-model:description="description"
      v-model:openUntil="openUntil"
      v-model:location="location"
      v-model:pendingDates="pendingDates"
      :loading="loading"
      :error-message="errorMessage"
      @submit="submit"
      @cancel="cancel"
    ></LobbyEdit>
  </PageContainer>
</template>

<style scoped></style>
