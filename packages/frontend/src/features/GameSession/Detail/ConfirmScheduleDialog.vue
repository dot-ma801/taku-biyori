<script setup lang="ts">
import { computed } from 'vue';
import BaseButton from '@/components/button/BaseButton.vue';
import BaseDialog from '@/components/dialog/BaseDialog.vue';
import BaseAlert from '@/components/common/BaseAlert/BaseAlert.vue';
import BaseStepper from '@/components/common/BaseStepper/BaseStepper.vue';
import CandidateStep from '@/features/Lobby/Detail/Schedule/ConfirmFlow/CandidateStep.vue';
import MemberSelectStep from '@/features/Lobby/Detail/Schedule/ConfirmFlow/MemberSelectStep.vue';
import ReviewStep from '@/features/Lobby/Detail/Schedule/ConfirmFlow/ReviewStep.vue';
import {
  useConfirmFlow,
  type GameSessionDraft,
} from '@/features/Lobby/Detail/Schedule/ConfirmFlow/useConfirmFlow';
import type { GameSessionModel } from '@/models/game-session';
import type { LobbyDetailModel } from '@/models/lobby';

/**
 * 日程の確定モーダル。**候補日を選ぶ → 当日の参加者を決める → 確認**の3ステップ。
 *
 * 当日の参加者は、選んだ候補日に ◯／△ で答えた人が既定で入る。
 * ここを外れた人も卓のメンバーには残り、プレイメモの閲覧だけができなくなる（#147）。
 * 定員との差はステップを止めず、確認ステップの注意書きで伝える。
 */
const STEP_LABELS = ['開催日を決める', '当日の参加者', '確認'] as const;

const props = defineProps<{ lobby: LobbyDetailModel }>();
const emit = defineEmits<{ created: [gameSession: GameSessionModel] }>();
const model = defineModel<boolean>({ default: false });

// template 内で ref を自動アンラップさせるため、composable の戻り値は分割代入で受ける
const {
  step,
  loading,
  loadingPoll,
  selectedCandidateId,
  scheduledAtLabel,
  selectedEntryIds,
  selectedEntries,
  selectedCount,
  candidateOptions,
  draft,
  canProceedCandidate,
  canProceedEntries,
  canConfirm,
  timeLabelCounter,
  capacityMismatch,
  selectCandidate,
  toggleEntry,
  isWarnedEntry,
  getEntryAnswer,
  goNext,
  goBack,
  confirm,
} = useConfirmFlow(
  () => props.lobby,
  () => model.value,
  (gameSession) => {
    model.value = false;
    emit('created', gameSession);
  },
);

const isNextDisabled = computed(() =>
  step.value === 1 ? !canProceedCandidate.value : !canProceedEntries.value,
);
const capacityMessage = computed(() =>
  props.lobby.maxPlayers === null
    ? ''
    : `定員は ${props.lobby.maxPlayers} 人ですが、${selectedCount.value} 人が選ばれています。このまま確定できます。`,
);

function updateDraft(next: GameSessionDraft) {
  draft.value = next;
}
</script>

<template>
  <BaseDialog v-model="model" title="日程を確定する">
    <!-- BaseStepper は ol + 読み上げ用の要素の2ルート。class は外側の箱で受ける -->
    <div class="stepper">
      <BaseStepper
        :steps="STEP_LABELS"
        :current="step"
        label="日程確定の手順"
      />
    </div>

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

    <template v-else>
      <ReviewStep
        :scheduled-at-label="scheduledAtLabel"
        :selected-entries="selectedEntries"
        :draft="draft"
        :time-label-counter="timeLabelCounter"
        @update:draft="updateDraft"
      />
      <BaseAlert v-if="capacityMismatch" class="capacity" variant="info">
        {{ capacityMessage }}
      </BaseAlert>
      <p class="reception-note">
        確定すると、新しい参加の受付は自動で閉じます（あとから追加募集できます）。
      </p>
    </template>

    <!--
      ステップ送りのボタンは #actions に置けない。BaseDialog の actions は
      Dialog.Close で包まれていて、領域内のクリックでダイアログごと閉じるため
      （「次へ」で閉じてしまう）。本文の末尾に自前のフッターとして置く。
    -->
    <div class="footer">
      <BaseButton v-if="step > 1" variant="ghost" @click="goBack">
        戻る
      </BaseButton>
      <BaseButton v-else variant="ghost" @click="model = false">
        キャンセル
      </BaseButton>
      <span class="footer__spacer" />
      <BaseButton v-if="step < 3" :disabled="isNextDisabled" @click="goNext">
        次へ
      </BaseButton>
      <BaseButton
        v-else
        :disabled="!canConfirm"
        :loading="loading"
        @click="confirm"
      >
        この日で確定する
      </BaseButton>
    </div>
  </BaseDialog>
</template>

<style scoped>
.stepper {
  margin-bottom: var(--space-5);
}

.capacity {
  margin-top: var(--space-4);
}

.footer {
  display: flex;
  align-items: center;
  gap: var(--space-2);
  margin-top: var(--space-6);
}

.footer__spacer {
  flex: 1;
}

.reception-note {
  margin: var(--space-3) 0 0;
  font: var(--text-caption);
  color: var(--text-tertiary);
}
</style>
