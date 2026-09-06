<script setup lang="ts">
import { computed } from 'vue';
import BaseButton from '@/components/button/BaseButton.vue';
import BaseDialog from '@/components/dialog/BaseDialog.vue';
import BaseAlert from '@/components/common/BaseAlert/BaseAlert.vue';
import BaseCollapsible from '@/components/common/BaseCollapsible/BaseCollapsible.vue';
import CandidateStep from '@/features/Lobby/Detail/Schedule/ConfirmFlow/CandidateStep.vue';
import MemberSelectStep from '@/features/Lobby/Detail/Schedule/ConfirmFlow/MemberSelectStep.vue';
import { useConfirmFlow } from '@/features/Lobby/Detail/Schedule/ConfirmFlow/useConfirmFlow';
import type { GameSessionModel } from '@/models/game-session';
import type { LobbyDetailModel } from '@/models/lobby';

/**
 * 日程の確定モーダル。**候補日を選ぶ1ステップ**で完結する（#152）。
 *
 * 当日の参加者は、選んだ候補日に ◯／△ で答えた人が既定で入る。
 * ここを外れた人も卓のメンバーには残り、プレイメモの閲覧だけができなくなる（#147）ので、
 * 内訳は畳んだ状態で見せて、必要なときだけ開いて調整できるようにしてある。
 */
const props = defineProps<{ lobby: LobbyDetailModel }>();
const emit = defineEmits<{ created: [gameSession: GameSessionModel] }>();
const model = defineModel<boolean>({ default: false });

// template 内で ref を自動アンラップさせるため、composable の戻り値は分割代入で受ける
const {
  loading,
  loadingPoll,
  dateMode,
  directDate,
  selectedCandidateId,
  selectedEntryIds,
  selectedCount,
  candidateOptions,
  canProceedCandidate,
  canProceedEntries,
  capacityMismatch,
  selectCandidate,
  setDateMode,
  setDirectDate,
  toggleEntry,
  isWarnedEntry,
  getEntryAnswer,
  confirm,
} = useConfirmFlow(
  () => props.lobby,
  () => model.value,
  (gameSession) => {
    model.value = false;
    emit('created', gameSession);
  },
);

const canConfirm = computed(
  () => canProceedCandidate.value && canProceedEntries.value,
);
const memberSummary = computed(() => `当日の参加者 ${selectedCount.value} 人`);
const capacityMessage = computed(() =>
  props.lobby.maxPlayers === null
    ? ''
    : `定員は ${props.lobby.maxPlayers} 人ですが、${selectedCount.value} 人が選ばれています。このまま確定できます。`,
);
</script>

<template>
  <BaseDialog v-model="model" title="この日で確定する">
    <div class="confirm">
      <CandidateStep
        :candidate-options="candidateOptions"
        :selected-candidate-id="selectedCandidateId"
        :date-mode="dateMode"
        :direct-date="directDate"
        :loading="loadingPoll"
        @select="selectCandidate"
        @change-mode="setDateMode"
        @change-direct-date="setDirectDate"
      />

      <BaseCollapsible v-if="canProceedCandidate" :title="memberSummary">
        <MemberSelectStep
          :entries="lobby.activeEntries"
          :selected-entry-ids="selectedEntryIds"
          :is-warned-entry="isWarnedEntry"
          :get-entry-answer="getEntryAnswer"
          @toggle="toggleEntry"
        />
      </BaseCollapsible>

      <BaseAlert v-if="canProceedCandidate && capacityMismatch" variant="info">
        {{ capacityMessage }}
      </BaseAlert>
    </div>

    <template #actions>
      <BaseButton variant="ghost" @click="model = false">キャンセル</BaseButton>
      <BaseButton :disabled="!canConfirm" :loading="loading" @click="confirm">
        この日で確定する
      </BaseButton>
    </template>
  </BaseDialog>
</template>

<style scoped>
.confirm {
  display: flex;
  flex-direction: column;
  gap: var(--space-4);
}
</style>
