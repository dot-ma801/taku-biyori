<script setup lang="ts">
import BaseButton from '@/components/button/BaseButton.vue';
import BaseDialog from '@/components/dialog/BaseDialog.vue';
import BaseStepper from '@/components/common/BaseStepper/BaseStepper.vue';
import CandidateStep from '@/features/Lobby/Detail/Schedule/ConfirmFlow/CandidateStep.vue';
import MemberSelectStep from '@/features/Lobby/Detail/Schedule/ConfirmFlow/MemberSelectStep.vue';
import ReviewStep from '@/features/Lobby/Detail/Schedule/ConfirmFlow/ReviewStep.vue';
import CapacityMismatchDialog from '@/features/Lobby/Detail/Schedule/ConfirmFlow/CapacityMismatchDialog.vue';
import { useConfirmFlow } from '@/features/Lobby/Detail/Schedule/ConfirmFlow/useConfirmFlow';
import type { LobbyAvailabilityDate, LobbyDetail } from '@taku-biyori/shared';
import { computed, ref } from 'vue';

// BaseStepper の steps.length と useConfirmFlow.ts の step 型上限（1 | 2 | 3）は
// 連動していないため、ステップ数を変更する場合は両方を修正すること。
const STEP_LABELS = ['候補日選択', '参加者選択', '確認'] as const;

const props = defineProps<{
  lobby: LobbyDetail;
  availabilityDates: LobbyAvailabilityDate[];
}>();

const emit = defineEmits<{
  'lobby-changed': [];
}>();

const model = defineModel<boolean>();

const {
  step,
  selectedCandidateId,
  selectedMemberIds,
  loading,
  candidateOptions,
  selectedCount,
  canProceedCandidate,
  canProceedMembers,
  capacityMismatch,
  isWarnedMember,
  selectCandidate,
  toggleMember,
  goNext,
  goBack,
  reset,
  confirm,
} = useConfirmFlow(
  props.lobby.id,
  () => props.lobby.members,
  () => props.availabilityDates,
  () => props.lobby.maxPlayers,
  () => emit('lobby-changed'),
);

const showCapacityDialog = ref(false);

const selectedDate = computed(
  () =>
    candidateOptions.value.find((d) => d.id === selectedCandidateId.value) ??
    null,
);

const selectedMembers = computed(() =>
  props.lobby.members.filter((m) => selectedMemberIds.value.has(m.id)),
);

function handleOpen() {
  reset();
  model.value = true;
}

function handleNextFromStep2() {
  if (capacityMismatch.value) {
    showCapacityDialog.value = true;
  } else {
    goNext();
  }
}

defineExpose({ handleOpen });
</script>

<template>
  <BaseDialog
    v-model="model"
    title="卓を確定する"
    @update:model-value="(v: boolean) => !v && reset()"
  >
    <BaseStepper :steps="STEP_LABELS" :current="step" label="卓確定の手順" />

    <CandidateStep
      v-if="step === 1"
      :candidate-options="candidateOptions"
      :selected-candidate-id="selectedCandidateId"
      @select="selectCandidate"
    />

    <MemberSelectStep
      v-else-if="step === 2"
      :members="lobby.members"
      :selected-member-ids="selectedMemberIds"
      :is-warned-member="isWarnedMember"
      @toggle="toggleMember"
    />

    <ReviewStep
      v-else-if="step === 3"
      :selected-date="selectedDate"
      :selected-members="selectedMembers"
    />

    <!-- ナビゲーションボタンは #actions スロットに置かない（クリックでダイアログが閉じるため） -->
    <div class="confirm-flow-footer">
      <BaseButton v-if="step > 1" variant="ghost" @click="goBack">
        戻る
      </BaseButton>
      <div class="spacer" />
      <BaseButton
        v-if="step < 3"
        :disabled="step === 1 ? !canProceedCandidate : !canProceedMembers"
        @click="step === 1 ? goNext() : handleNextFromStep2()"
      >
        次へ
      </BaseButton>
      <BaseButton v-else variant="primary" :loading="loading" @click="confirm">
        確定する
      </BaseButton>
    </div>
  </BaseDialog>

  <CapacityMismatchDialog
    v-model="showCapacityDialog"
    :max-players="lobby.maxPlayers"
    :selected-count="selectedCount"
    @confirm="
      () => {
        showCapacityDialog = false;
        goNext();
      }
    "
  />
</template>

<style scoped>
.confirm-flow-footer {
  display: flex;
  align-items: center;
  gap: var(--space-2);
  margin-top: var(--space-5);
}

.spacer {
  flex: 1;
}
</style>
