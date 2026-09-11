<script setup lang="ts">
import BaseButton from '@/components/button/BaseButton.vue';
import BaseAlert from '@/components/common/BaseAlert/BaseAlert.vue';
import CandidateDateEditor from '@/features/Lobby/Detail/Schedule/CandidateDateEditor.vue';
import { useRestartSchedulePoll } from '@/features/Lobby/Detail/Schedule/useRestartSchedulePoll';
import { RotateCcw, Check } from '@lucide/vue';
import { computed } from 'vue';
import type { LobbyStatus } from '@taku-biyori/shared';

/**
 * ホスト向け「日程調整をやり直す」導線。
 * 「やり直す」ボタン → 確認文＋候補日入力＋「実行する / やめる」の2段階をインラインで出す
 * （確認用のダイアログコンポーネントがリポジトリに無いため。CLAUDE.md 参照）。
 */

const props = defineProps<{
  lobbyId: string;
  hostUserId: string;
  status: LobbyStatus;
}>();

const emit = defineEmits<{
  // 新しい日程調整の作成に成功した。schedulePolls が変わるため、
  // 親（Lobby/Detail）にロビー詳細の再取得を依頼する
  created: [];
}>();

const {
  canRestart,
  isConfirming,
  pendingDates,
  loading,
  errorMessages,
  start,
  cancel,
  confirmRestart,
} = useRestartSchedulePoll(
  props.lobbyId,
  () => props.hostUserId,
  () => props.status,
  () => emit('created'),
);

const hasErrors = computed(() => errorMessages.value.length > 0);
</script>

<template>
  <div v-if="canRestart" class="restart">
    <BaseButton
      v-if="!isConfirming"
      variant="secondary"
      :left-icon="RotateCcw"
      @click="start"
    >
      日程調整をやり直す
    </BaseButton>

    <div v-else class="confirm-panel">
      <BaseAlert variant="warning">
        新しく日程調整を始めると、現在の調整は読み取り専用の履歴になります。この操作は元に戻せません。
      </BaseAlert>

      <CandidateDateEditor v-model="pendingDates" />

      <div v-if="hasErrors" class="error-area">
        <BaseAlert
          v-for="message in errorMessages"
          :key="message"
          variant="error"
        >
          {{ message }}
        </BaseAlert>
      </div>

      <div class="actions">
        <BaseButton variant="ghost" :disabled="loading" @click="cancel">
          やめる
        </BaseButton>
        <BaseButton
          variant="danger"
          :left-icon="Check"
          :loading="loading"
          @click="confirmRestart"
        >
          実行する
        </BaseButton>
      </div>
    </div>
  </div>
</template>

<style scoped>
.confirm-panel {
  display: flex;
  flex-direction: column;
  gap: var(--space-4);
  margin-top: var(--space-2);
}

.error-area {
  display: flex;
  flex-direction: column;
  gap: var(--space-1);
}

.actions {
  display: flex;
  justify-content: flex-end;
  gap: var(--space-2);
}
</style>
