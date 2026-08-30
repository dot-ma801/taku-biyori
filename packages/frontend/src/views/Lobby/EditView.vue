<script setup lang="ts">
import LobbyEdit from '@/features/Lobby/Edit/index.vue';
import BaseAlert from '@/components/common/BaseAlert/BaseAlert.vue';
import BaseButton from '@/components/button/BaseButton.vue';
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
  loading,
  errorMessages,
  fetchError,
  fetchInitialValues,
  submit,
  cancel,
} = useUpdateLobby(props.lobbyId);
</script>

<template>
  <PageContainer>
    <div v-if="fetchError" class="fetch-error">
      <BaseAlert variant="error" title="ロビー情報の取得に失敗しました">
        {{ fetchError }}
      </BaseAlert>
      <div class="fetch-error__actions">
        <BaseButton variant="secondary" :disabled="loading" @click="cancel">
          戻る
        </BaseButton>
        <BaseButton :disabled="loading" @click="fetchInitialValues">
          再試行
        </BaseButton>
      </div>
    </div>
    <LobbyEdit
      v-else
      heading="ロビー編集"
      submit-label="ロビーを更新する"
      v-model:title="title"
      v-model:scenarioName="scenarioName"
      v-model:maxMembers="maxMembers"
      v-model:description="description"
      v-model:openUntil="openUntil"
      v-model:location="location"
      :show-candidate-dates="false"
      :loading="loading"
      :error-messages="errorMessages"
      @submit="submit"
      @cancel="cancel"
    ></LobbyEdit>
  </PageContainer>
</template>

<style scoped>
.fetch-error {
  display: flex;
  flex-direction: column;
  gap: var(--space-4);
}

.fetch-error__actions {
  display: flex;
  justify-content: flex-end;
  gap: var(--space-3);
}
</style>
