<script setup lang="ts">
import { computed } from 'vue';
import LobbyEdit from '@/features/Lobby/Edit/index.vue';
import BaseAlert from '@/components/common/BaseAlert/BaseAlert.vue';
import BaseBreadcrumb from '@/components/common/BaseBreadcrumb/BaseBreadcrumb.vue';
import BaseButton from '@/components/button/BaseButton.vue';
import PageContainer from '@/components/layout/PageContainer/PageContainer.vue';
import { useUpdateLobby } from '@/features/Lobby/Edit/composables/useUpdateLobby';

const props = defineProps<{
  lobbyId: string;
}>();

const {
  title,
  savedTitle,
  scenarioName,
  maxMembers,
  description,
  openUntil,
  location,
  loading,
  errorMessages,
  fetchError,
  hasSchedulePoll,
  fetchInitialValues,
  submit,
  cancel,
} = useUpdateLobby(props.lobbyId);

// URL を入れ子にしたぶん（design-v2 §7-1）、階層を辿る導線を画面にも置く
const breadcrumbItems = computed(() => [
  { label: 'ダッシュボード', to: { name: 'dashboard' } },
  {
    label: savedTitle.value || 'ロビー',
    to: { name: 'lobbies-detail', params: { lobbyId: props.lobbyId } },
  },
  { label: 'ロビーの編集' },
]);
</script>

<template>
  <PageContainer>
    <BaseBreadcrumb class="breadcrumb" :items="breadcrumbItems" />

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
      :has-schedule-poll="hasSchedulePoll"
      @submit="submit"
      @cancel="cancel"
    ></LobbyEdit>
  </PageContainer>
</template>

<style scoped>
.breadcrumb {
  margin-bottom: var(--space-4);
}

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
