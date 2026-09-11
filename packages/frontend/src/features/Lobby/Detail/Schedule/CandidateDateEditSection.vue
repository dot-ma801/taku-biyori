<script setup lang="ts">
import BaseButton from '@/components/button/BaseButton.vue';
import BaseAlert from '@/components/common/BaseAlert/BaseAlert.vue';
import CandidateDateEditor from '@/features/Lobby/Detail/Schedule/CandidateDateEditor.vue';
import { useCandidateDateEdit } from '@/features/Lobby/Detail/Schedule/useCandidateDateEdit';
import { SquarePen, Check } from '@lucide/vue';
import { computed } from 'vue';
import type { LobbyStatus } from '@taku-biyori/shared';
import type { CandidateDateModel } from '@/models/schedule-poll';

/** ホスト向け「候補日を編集」導線。最新の日程調整の候補日を一括で差し替える。 */

const props = defineProps<{
  lobbyId: string;
  /** 最新の日程調整 id。調整が1件も無いロビーでは null（このときは何も表示しない） */
  pollId: string | null;
  hostUserId: string;
  status: LobbyStatus;
  /** サーバ値（現在の候補日）。readonly。編集ドラフトはこの composable の中でコピーして持つ */
  candidateDates: CandidateDateModel[];
}>();

const emit = defineEmits<{
  // 候補日の差し替えに成功した。親（useSchedulePoll）に候補日の再取得を依頼する
  updated: [];
  // 409（最新の調整でなくなった）。親（Lobby/Detail）にロビー詳細の再取得を依頼する
  stale: [];
}>();

const {
  canEditCandidateDates,
  isEditing,
  pendingDates,
  loading,
  errorMessages,
  enterEditMode,
  cancelEdit,
  submitEdit,
} = useCandidateDateEdit(
  props.lobbyId,
  () => props.pollId,
  () => props.hostUserId,
  () => props.status,
  () => props.candidateDates,
  () => emit('updated'),
  () => emit('stale'),
);

const canShow = computed(
  () => canEditCandidateDates.value && props.pollId !== null,
);
const hasErrors = computed(() => errorMessages.value.length > 0);
</script>

<template>
  <div v-if="canShow" class="candidate-date-edit">
    <BaseButton
      v-if="!isEditing"
      variant="secondary"
      :left-icon="SquarePen"
      @click="enterEditMode"
    >
      候補日を編集
    </BaseButton>

    <div v-else class="edit-panel">
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
        <BaseButton variant="secondary" :disabled="loading" @click="cancelEdit">
          キャンセル
        </BaseButton>
        <BaseButton :left-icon="Check" :loading="loading" @click="submitEdit">
          保存する
        </BaseButton>
      </div>
    </div>
  </div>
</template>

<style scoped>
.edit-panel {
  display: flex;
  flex-direction: column;
  gap: var(--space-4);
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
