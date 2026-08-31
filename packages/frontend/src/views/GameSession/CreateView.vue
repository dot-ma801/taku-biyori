<script setup lang="ts">
import BaseButton from '@/components/button/BaseButton.vue';
import BaseAlert from '@/components/common/BaseAlert/BaseAlert.vue';
import BaseSectionHeading from '@/components/common/BaseSectionHeading/BaseSectionHeading.vue';
import PageContainer from '@/components/layout/PageContainer/PageContainer.vue';
import BaseDatePicker from '@/components/form/BaseDatePicker/BaseDatePicker.vue';
import BaseTextArea from '@/components/form/BaseTextArea/BaseTextArea.vue';
import BaseTextBox from '@/components/form/BaseTextBox/BaseTextBox.vue';
import { createGameSession } from '@/api/game-session';
import { createLobby, getLobby } from '@/api/lobby';
import { ApiError } from '@/lib/api-client';
import { ref } from 'vue';
import { useRouter } from 'vue-router';

const router = useRouter();
const title = ref('');
const scheduledAt = ref('');
const scenarioName = ref('');
const location = ref('');
const timeLabel = ref('');
const description = ref('');
const loading = ref(false);
const errorMessage = ref('');

async function submit() {
  if (!title.value.trim() || !scheduledAt.value) {
    errorMessage.value = 'タイトルと開催日を入力してください';
    return;
  }
  loading.value = true;
  errorMessage.value = '';
  try {
    // 直接卓立ても必ずロビーを作る。候補日を省略した下書きロビーなので受付は開かない。
    const lobby = await createLobby({
      title: title.value,
      ...(scenarioName.value && { scenarioName: scenarioName.value }),
      ...(location.value && { location: location.value }),
    });
    const detail = await getLobby(lobby.id);
    const hostEntry = detail.activeEntries.find(
      (entry) => entry.userId === detail.hostUserId,
    );
    if (!hostEntry) throw new Error('ホストの参加情報が見つかりません');
    const gameSession = await createGameSession(lobby.id, {
      scheduledAt: scheduledAt.value,
      entryIds: [hostEntry.id],
      ...(timeLabel.value && { timeLabel: timeLabel.value }),
      ...(description.value && { description: description.value }),
    });
    await router.push({
      name: 'game-sessions-detail',
      params: { lobbyId: lobby.id, gameSessionId: gameSession.id },
    });
  } catch (error) {
    errorMessage.value =
      error instanceof ApiError ? error.message : '開催の作成に失敗しました';
  } finally {
    loading.value = false;
  }
}
</script>

<template>
  <PageContainer>
    <form class="form" @submit.prevent="submit">
      <BaseSectionHeading level="h1">直接卓を立てる</BaseSectionHeading>
      <p class="description">
        受付を開かないロビーと開催をまとめて作成します。
      </p>
      <BaseAlert v-if="errorMessage" variant="error">{{
        errorMessage
      }}</BaseAlert>
      <BaseTextBox v-model="title" label="呼び名" required />
      <BaseDatePicker
        v-model="scheduledAt"
        label="開催日"
        required
        disable-past
      />
      <BaseTextBox v-model="scenarioName" label="シナリオ名" />
      <BaseTextBox v-model="location" label="場所" />
      <BaseTextBox v-model="timeLabel" label="時間帯" />
      <BaseTextArea v-model="description" label="当日の連絡事項" />
      <div class="actions">
        <BaseButton type="button" variant="secondary" @click="router.back()"
          >キャンセル</BaseButton
        >
        <BaseButton type="submit" :loading="loading">開催を作成する</BaseButton>
      </div>
    </form>
  </PageContainer>
</template>

<style scoped>
.form {
  display: flex;
  flex-direction: column;
  gap: var(--space-4);
}
.description {
  margin: 0;
  color: var(--color-text-muted);
}
.actions {
  display: flex;
  justify-content: flex-end;
  gap: var(--space-2);
}
</style>
