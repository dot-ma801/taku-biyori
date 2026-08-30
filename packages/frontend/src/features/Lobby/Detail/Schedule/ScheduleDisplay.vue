<script setup lang="ts">
import BaseCard from '@/components/common/BaseCard/BaseCard.vue';
import BaseSectionHeading from '@/components/common/BaseSectionHeading/BaseSectionHeading.vue';
import BaseButton from '@/components/button/BaseButton.vue';
import ScheduleTable from '@/features/Lobby/Detail/Schedule/ScheduleTable.vue';
import ScheduleCardList from '@/features/Lobby/Detail/Schedule/ScheduleCardList.vue';
import { useSchedulePoll } from '@/features/Lobby/Detail/Schedule/useSchedulePoll';
import { useGuestSchedule } from '@/features/Lobby/Detail/Schedule/useGuestSchedule';
import { isGuestMember } from '@taku-biyori/shared';
import type { LobbyDetailModel } from '@/models/lobby';
import type { Answer } from '@/features/Lobby/Detail/Schedule/types';
import { CalendarCheck, SquarePen, Check, RotateCcw } from '@lucide/vue';
import { computed } from 'vue';
import { useRoute } from 'vue-router';
import { useMyLobbyMemberId } from '@/features/Lobby/Detail/composables/useMyLobbyMemberId';

const props = defineProps<{
  lobby: LobbyDetailModel;
}>();

const emit = defineEmits<{
  // 送信時に日程調整が最新でなくなっていた（409）とき、親にロビー詳細の再取得を依頼する
  stale: [];
}>();

const { myMemberId: myEntryId } = useMyLobbyMemberId(
  () => props.lobby.activeEntries,
);

// ロビー詳細が持つ最新の日程調整 id。調整が1件も無ければ null
// （<template> に式を書かず computed に切り出す：CLAUDE.md ルール）
const latestPollId = computed(() => props.lobby.schedulePolls[0]?.id ?? null);

const {
  candidateDates,
  loading,
  errorMessage,
  canInputSchedule,
  isEditing,
  draftAnswers,
  enterEditMode,
  cancelEdit,
  cycleAnswer,
  submitEdit,
  refetch: refetchPoll,
} = useSchedulePoll(
  props.lobby.id,
  latestPollId,
  () => myEntryId.value,
  () => props.lobby.status,
  () => emit('stale'),
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
  props.lobby.id,
  token,
  latestPollId,
  () => candidateDates.value,
  () => props.lobby.status,
  refetchPoll,
  () => emit('stale'),
);

// ===== 表（ScheduleTable）への入力をモードに応じて組み立てる =====

// いずれかの編集モード中か（自分の列編集 or ゲスト編集）
const isScheduleEditing = computed(
  () => isEditing.value || isEditingGuestSchedule.value,
);

// 編集できるメンバー列の id。自分の列編集なら自分のみ、ゲスト編集ならゲスト列すべて
const editableEntryIds = computed<string[]>(() => {
  if (isEditing.value && myEntryId.value) return [myEntryId.value];
  if (isEditingGuestSchedule.value) {
    return props.lobby.activeEntries
      .filter((m) => isGuestMember(m))
      .map((m) => m.id);
  }
  return [];
});

// 表に渡すドラフト。キーを `${entryId}::${dateId}` に統一する
const tableDraftAnswers = computed<Map<string, Answer>>(() => {
  if (isEditing.value && myEntryId.value) {
    const map = new Map<string, Answer>();
    for (const [dateId, answer] of draftAnswers.value) {
      map.set(`${myEntryId.value}::${dateId}`, answer);
    }
    return map;
  }
  if (isEditingGuestSchedule.value) return guestDraftAnswers.value;
  return new Map();
});

// セルクリック：モードに応じて対象の回答をトグルする
function onCellClick(entryId: string, dateId: string) {
  if (isEditing.value) cycleAnswer(dateId);
  else if (isEditingGuestSchedule.value)
    cycleAnswerGuestSchedule(entryId, dateId);
}

// 「回答を編集する」：メンバーなら自分の列、ゲストならゲスト編集を開始
function startScheduleEdit() {
  if (myEntryId.value) enterEditMode();
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
const canShowScheduleActions = computed(
  () => myEntryId.value !== null || canEditGuestSchedule.value,
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
      <div class="schedule-table">
        <ScheduleTable
          :candidate-dates="candidateDates"
          :members="props.lobby.activeEntries"
          :my-entry-id="myEntryId"
          :editable-entry-ids="editableEntryIds"
          :draft-answers="tableDraftAnswers"
          @cell-click="onCellClick"
        />
      </div>
      <div class="schedule-cards">
        <ScheduleCardList
          :candidate-dates="candidateDates"
          :members="props.lobby.activeEntries"
          :my-entry-id="myEntryId"
          :editable-entry-ids="editableEntryIds"
          :draft-answers="tableDraftAnswers"
          @cell-click="onCellClick"
        />
      </div>
      <div v-if="canShowScheduleActions" class="actions">
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
            v-if="canEditSchedule"
            variant="secondary"
            :left-icon="SquarePen"
            @click="startScheduleEdit"
          >
            回答を編集する
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

/* 768px 以下ではテーブルをカード表示にフォールバックする */
.schedule-cards {
  display: none;
}

@media (max-width: 768px) {
  .schedule-table {
    display: none;
  }

  .schedule-cards {
    display: block;
  }
}
</style>
