<script setup lang="ts">
import BaseCard from '@/components/common/BaseCard/BaseCard.vue';
import BaseSectionHeading from '@/components/common/BaseSectionHeading/BaseSectionHeading.vue';
import BaseButton from '@/components/button/BaseButton.vue';
import ScheduleTable from '@/features/GameSession/Detail/Schedule/ScheduleTable.vue';
import { useSchedule } from '@/features/GameSession/Detail/Schedule/useSchedule';
import type { GameSession, GameSessionDetail } from '@taku-biyori/shared';
import type { Answer } from '@/features/GameSession/Detail/Schedule/types';
import { useSession } from '@/lib/auth';
import { CalendarCheck, SquarePen, Check, RotateCcw } from '@lucide/vue';
import { computed, ref, onMounted, onUnmounted } from 'vue';
import { useRoute } from 'vue-router';
import { useScheduleConfirm } from '@/features/GameSession/Detail/Schedule/useScheduleConfirm';
import { useGuestSchedule } from '@/features/GameSession/Detail/Schedule/useGuestSchedule';

const props = defineProps<{
  gameSession: GameSessionDetail;
}>();

const emit = defineEmits<{
  'session-updated': [updated: GameSession];
}>();

// useSession は nanostores の Atom なので Vue の ref に変換する
const sessionData = ref(useSession.get());
let unsubscribeSession: (() => void) | undefined;

onMounted(() => {
  unsubscribeSession = useSession.subscribe((v) => {
    sessionData.value = v;
  });
});

onUnmounted(() => {
  unsubscribeSession?.();
});

const myMemberId = computed(
  () =>
    props.gameSession.members.find(
      (m) => m.userId === sessionData.value.data?.user?.id,
    )?.id ?? null,
);

const {
  availabilityDates,
  loading,
  errorMessage,
  canInputSchedule,
  isEditing,
  draftAnswers,
  enterEditMode,
  cancelEdit,
  cycleAnswer,
  submitEdit,
  refetch: refetchSchedule,
} = useSchedule(
  props.gameSession.id,
  myMemberId,
  () => props.gameSession.status,
);

// token は招待リンク（?token=）由来。route から読み、getter で composable へ渡す
const route = useRoute();
const token = () => route.query.token?.toString() ?? null;

const {
  loading: loadingGuestSchedule,
  isEditing: isEditingGuestSchedule,
  canEditGuestSchedule,
  hasChanges: hasGuestChanges,
  draftAnswers: guestDraftAnswers,
  cycleAnswer: cycleAnswerGuestSchedule,
  enterEditMode: enterEditModeGuestSchedule,
  cancelEdit: cancelGuestEdit,
  submitEdit: submitGuestEdit,
} = useGuestSchedule(
  props.gameSession.id,
  token,
  availabilityDates,
  () => props.gameSession.status,
  refetchSchedule,
);

const selectedDateId = ref<string | null>(null);

const {
  canConfirm,
  loading: loadingScheduleConfirm,
  confirmDate,
} = useScheduleConfirm(
  props.gameSession.id,
  () => props.gameSession.createdBy,
  () => props.gameSession.status,
  (updated) => emit('session-updated', updated),
);

// ===== 表（ScheduleTable）への入力をモードに応じて組み立てる =====

// いずれかの編集モード中か（自分の列編集 or ゲスト編集）
const isScheduleEditing = computed(
  () => isEditing.value || isEditingGuestSchedule.value,
);

// 編集できるメンバー列の id。自分の列編集なら自分のみ、ゲスト編集ならゲスト列すべて
const editableMemberIds = computed<string[]>(() => {
  if (isEditing.value && myMemberId.value) return [myMemberId.value];
  if (isEditingGuestSchedule.value) {
    return props.gameSession.members
      .filter((m) => m.userId === null)
      .map((m) => m.id);
  }
  return [];
});

// 表に渡すドラフト。キーを `${memberId}::${dateId}` に統一する
const tableDraftAnswers = computed<Map<string, Answer>>(() => {
  if (isEditing.value && myMemberId.value) {
    const map = new Map<string, Answer>();
    for (const [dateId, answer] of draftAnswers.value) {
      map.set(`${myMemberId.value}::${dateId}`, answer);
    }
    return map;
  }
  if (isEditingGuestSchedule.value) return guestDraftAnswers.value;
  return new Map();
});

// セルクリック：モードに応じて対象の回答をトグルする
function onCellClick(memberId: string, dateId: string) {
  if (isEditing.value) cycleAnswer(dateId);
  else if (isEditingGuestSchedule.value)
    cycleAnswerGuestSchedule(memberId, dateId);
}

// 「回答を編集する」：メンバーなら自分の列、ゲストならゲスト編集を開始
function startScheduleEdit() {
  if (myMemberId.value) enterEditMode();
  else if (canEditGuestSchedule.value) enterEditModeGuestSchedule();
}

// 「キャンセル」：編集モードに応じてキャンセルする
function cancelScheduleEdit() {
  if (isEditingGuestSchedule.value) cancelGuestEdit();
  else cancelEdit();
}

// 「完了」：編集モードに応じて送信する
function finishScheduleEdit() {
  if (isEditingGuestSchedule.value) submitGuestEdit();
  else submitEdit();
}

// 完了ボタンの loading / 非活性（ゲスト編集時のみ制御する）
const finishLoading = computed(
  () => isEditingGuestSchedule.value && loadingGuestSchedule.value,
);
const finishDisabled = computed(
  () => isEditingGuestSchedule.value && !hasGuestChanges.value,
);

// template 内の式を computed に切り出す（CLAUDE.md ルール）
const displayMemberId = computed(
  () => myMemberId.value || canEditGuestSchedule.value,
);
const canEditSchedule = computed(
  () => canInputSchedule.value || canEditGuestSchedule.value,
);
</script>

<template>
  <BaseCard>
    <BaseSectionHeading class="heading" level="h3" :icon="CalendarCheck">
      日程調整
    </BaseSectionHeading>

    <div v-if="loading" class="state-message">読み込み中...</div>
    <div v-else-if="errorMessage" class="state-message error">
      {{ errorMessage }}
    </div>
    <template v-else>
      <ScheduleTable
        :availability-dates="availabilityDates"
        :members="props.gameSession.members"
        :my-member-id="myMemberId"
        :editable-member-ids="editableMemberIds"
        :draft-answers="tableDraftAnswers"
        :can-confirm="canConfirm"
        :selected-date-id="selectedDateId"
        @cell-click="onCellClick"
        @date-select="(id) => (selectedDateId = id)"
      />
      <div v-if="displayMemberId" class="actions">
        <template v-if="isScheduleEditing">
          <BaseButton
            variant="secondary"
            :left-icon="RotateCcw"
            @click="cancelScheduleEdit"
          >
            キャンセル
          </BaseButton>
          <BaseButton
            :left-icon="Check"
            :loading="finishLoading"
            :disabled="finishDisabled"
            @click="finishScheduleEdit"
          >
            完了
          </BaseButton>
        </template>
        <template v-else>
          <BaseButton
            v-if="canConfirm && selectedDateId"
            variant="secondary"
            :left-icon="RotateCcw"
            class="reset-btn"
            @click="selectedDateId = null"
          >
            選択を解除
          </BaseButton>
          <BaseButton
            v-if="canEditSchedule"
            variant="secondary"
            :left-icon="SquarePen"
            @click="startScheduleEdit"
          >
            回答を編集する
          </BaseButton>
          <BaseButton
            v-if="canConfirm"
            :loading="loadingScheduleConfirm"
            :left-icon="CalendarCheck"
            :disabled="!selectedDateId"
            @click="selectedDateId && confirmDate(selectedDateId)"
          >
            開催日を確定
          </BaseButton>
        </template>
      </div>
    </template>
  </BaseCard>
</template>

<style scoped>
.heading {
  margin-bottom: var(--space-4);
}

.state-message {
  font-size: 14px;
  color: var(--color-text-muted);
  padding: var(--space-4) 0;
}

.state-message.error {
  color: var(--color-error);
}

.actions {
  display: flex;
  justify-content: flex-end;
  margin-top: var(--space-3);

  > * {
    margin: 0 var(--space-1);
  }
}

.reset-btn {
  margin-right: auto;
}
</style>
