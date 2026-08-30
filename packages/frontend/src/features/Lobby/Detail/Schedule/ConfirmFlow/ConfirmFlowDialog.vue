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

const STEP_LABELS = ['開催日選択', '参加者選択', '確認'] as const;
const props = defineProps<{ lobby: LobbyDetailModel }>();
const emit = defineEmits<{ created: [gameSession: GameSessionModel] }>();
const model = defineModel<boolean>({ default: false });
const showCapacityDialog = ref(false);
const flow = useConfirmFlow(
  () => props.lobby,
  (gameSession) => {
    model.value = false;
    emit('created', gameSession);
  },
);
const isNextDisabled = computed(() =>
  flow.step.value === 1
    ? !flow.canProceedDate.value
    : !flow.canProceedEntries.value,
);

async function handleModelUpdate(open: boolean) {
  if (open) await flow.reset();
}

function handleNext() {
  if (flow.step.value === 2 && flow.capacityMismatch.value) {
    showCapacityDialog.value = true;
    return;
  }
  flow.goNext();
}

function confirmCapacity() {
  showCapacityDialog.value = false;
  flow.goNext();
}

function updateDraft(draft: GameSessionDraft) {
  flow.draft.value = draft;
}
</script>

<template>
  <BaseDialog
    v-model="model"
    title="開催を追加する"
    @update:model-value="handleModelUpdate"
  >
    <BaseStepper
      :steps="STEP_LABELS"
      :current="flow.step"
      label="開催追加の手順"
    />
    <CandidateStep
      v-if="flow.step === 1"
      :candidate-options="flow.candidateOptions"
      :selected-candidate-id="flow.selectedCandidateId"
      :scheduled-at="flow.scheduledAt"
      :loading="flow.loadingPoll"
      @select="flow.selectCandidate"
      @update:scheduled-at="flow.setScheduledAt"
    />
    <MemberSelectStep
      v-else-if="flow.step === 2"
      :entries="lobby.activeEntries"
      :selected-entry-ids="flow.selectedEntryIds"
      :is-warned-entry="flow.isWarnedEntry"
      :get-entry-answer="flow.getEntryAnswer"
      @toggle="flow.toggleEntry"
    />
    <ReviewStep
      v-else
      :scheduled-at="flow.scheduledAt"
      :selected-entries="flow.selectedEntries"
      :draft="flow.draft"
      @update:draft="updateDraft"
    />
    <div class="footer">
      <BaseButton v-if="flow.step > 1" variant="ghost" @click="flow.goBack">
        戻る
      </BaseButton>
      <span class="spacer" />
      <BaseButton
        v-if="flow.step < 3"
        :disabled="isNextDisabled"
        @click="handleNext"
      >
        次へ
      </BaseButton>
      <BaseButton
        v-else
        variant="primary"
        :loading="flow.loading"
        @click="flow.confirm"
      >
        追加する
      </BaseButton>
    </div>
  </BaseDialog>
  <CapacityMismatchDialog
    v-model="showCapacityDialog"
    :max-players="lobby.maxPlayers"
    :selected-count="flow.selectedCount"
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
