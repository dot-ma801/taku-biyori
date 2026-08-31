<script setup lang="ts">
import BaseButton from '@/components/button/BaseButton.vue';
import BaseDialog from '@/components/dialog/BaseDialog.vue';
import BaseStepper from '@/components/common/BaseStepper/BaseStepper.vue';
import CandidateStep from '@/features/Lobby/Detail/Schedule/ConfirmFlow/CandidateStep.vue';
import CapacityMismatchDialog from '@/features/Lobby/Detail/Schedule/ConfirmFlow/CapacityMismatchDialog.vue';
import MemberSelectStep from '@/features/Lobby/Detail/Schedule/ConfirmFlow/MemberSelectStep.vue';
import ReviewStep from '@/features/Lobby/Detail/Schedule/ConfirmFlow/ReviewStep.vue';
import {
  useConfirmFlow,
  type GameSessionDraft,
} from '@/features/Lobby/Detail/Schedule/ConfirmFlow/useConfirmFlow';
import type { GameSessionModel } from '@/models/game-session';
import type { LobbyDetailModel } from '@/models/lobby';
import { computed, ref } from 'vue';

const STEP_LABELS = ['候補日選択', '参加者選択', '確認'] as const;
const props = defineProps<{ lobby: LobbyDetailModel }>();
const emit = defineEmits<{ created: [gameSession: GameSessionModel] }>();
const model = defineModel<boolean>({ default: false });
const showCapacityDialog = ref(false);
// template 内で ref を自動アンラップさせるため、composable の戻り値は分割代入で受ける
const {
  step,
  loading,
  loadingPoll,
  selectedCandidateId,
  scheduledAt,
  selectedEntryIds,
  selectedEntries,
  selectedCount,
  candidateOptions,
  draft,
  canProceedCandidate,
  canProceedEntries,
  capacityMismatch,
  selectCandidate,
  toggleEntry,
  isWarnedEntry,
  getEntryAnswer,
  goNext,
  goBack,
  reset,
  confirm,
} = useConfirmFlow(
  () => props.lobby,
  (gameSession) => {
    model.value = false;
    emit('created', gameSession);
  },
);
const isNextDisabled = computed(() =>
  step.value === 1 ? !canProceedCandidate.value : !canProceedEntries.value,
);

async function handleModelUpdate(open: boolean) {
  if (open) {
    await reset();
  }
}

function handleNext() {
  if (step.value === 2 && capacityMismatch.value) {
    showCapacityDialog.value = true;
    return;
  }
  goNext();
}

function confirmCapacity() {
  showCapacityDialog.value = false;
  goNext();
}

function updateDraft(next: GameSessionDraft) {
  draft.value = next;
}
</script>

<template>
  <BaseDialog
    v-model="model"
    title="開催を追加する"
    @update:model-value="handleModelUpdate"
  >
    <BaseStepper :steps="STEP_LABELS" :current="step" label="開催追加の手順" />
    <CandidateStep
      v-if="step === 1"
      :candidate-options="candidateOptions"
      :selected-candidate-id="selectedCandidateId"
      :loading="loadingPoll"
      @select="selectCandidate"
    />
    <MemberSelectStep
      v-else-if="step === 2"
      :entries="lobby.activeEntries"
      :selected-entry-ids="selectedEntryIds"
      :is-warned-entry="isWarnedEntry"
      :get-entry-answer="getEntryAnswer"
      @toggle="toggleEntry"
    />
    <ReviewStep
      v-else
      :scheduled-at="scheduledAt"
      :selected-entries="selectedEntries"
      :draft="draft"
      @update:draft="updateDraft"
    />
    <div class="footer">
      <BaseButton v-if="step > 1" variant="ghost" @click="goBack">
        戻る
      </BaseButton>
      <span class="spacer" />
      <BaseButton
        v-if="step < 3"
        :disabled="isNextDisabled"
        @click="handleNext"
      >
        次へ
      </BaseButton>
      <BaseButton v-else variant="primary" :loading="loading" @click="confirm">
        追加する
      </BaseButton>
    </div>
  </BaseDialog>
  <CapacityMismatchDialog
    v-model="showCapacityDialog"
    :max-players="lobby.maxPlayers"
    :selected-count="selectedCount"
    @confirm="confirmCapacity"
  />
</template>

<style scoped>
.footer {
  display: flex;
  align-items: center;
  gap: var(--space-2);
  margin-top: var(--space-5);
}

.spacer {
  flex: 1;
}
</style>
