<script setup lang="ts">
import type { LobbyAvailabilityDate, LobbyMember } from '@taku-biyori/shared';
import AnswerCell from '@/features/Lobby/Detail/Schedule/AnswerCell.vue';
import UserAvatar from '@/features/user/UserAvatar/UserAvatar.vue';
import { useScheduleView } from '@/features/Lobby/Detail/Schedule/useScheduleView';
import { useScheduleEditHint } from '@/features/Lobby/Detail/Schedule/useScheduleEditHint';
import type { Answer } from '@/features/Lobby/Detail/Schedule/types';
import { formatDateWithWeekday } from '@/utils/date';
import { memberDisplayName, memberBaseName } from '@/utils/memberDisplayName';
import { Clock } from '@lucide/vue';
import { computed, toRef } from 'vue';

const props = defineProps<{
  availabilityDates: LobbyAvailabilityDate[];
  members: LobbyMember[];
  myMemberId: string | null;
  // いま編集可能なメンバー列の id 一覧
  editableMemberIds: string[];
  // 編集中ドラフト。`${memberId}::${dateId}` → 回答
  draftAnswers: Map<string, Answer>;
  canConfirm?: boolean;
  selectedDateId?: string | null;
}>();

const emit = defineEmits<{
  cellClick: [memberId: string, dateId: string];
  dateSelect: [dateId: string];
}>();

const { getAnswer } = useScheduleView(
  toRef(props, 'editableMemberIds'),
  toRef(props, 'draftAnswers'),
);

const { isEditing, isMyAnswerEditable, editHint } = useScheduleEditHint(
  () => props.editableMemberIds,
  () => props.myMemberId,
  'card',
);

const hasDates = computed(() => props.availabilityDates.length > 0);

// チップの見た目を回答状態で切り替えるためのクラス（未回答は 'none'）
function chipAnswerClass(
  date: LobbyAvailabilityDate,
  memberId: string,
): string {
  const answer = getAnswer(date, memberId);
  return `chip--${answer ?? 'none'}`;
}

// 自分の回答（「あなたの回答」行の表示用）
function myAnswer(date: LobbyAvailabilityDate): Answer | null {
  if (!props.myMemberId) return null;
  return getAnswer(date, props.myMemberId);
}

// このメンバーのチップがいま編集可能か
function isChipEditable(memberId: string): boolean {
  return props.editableMemberIds.includes(memberId);
}

// 編集可能なチップ・回答行に付与するアクセシビリティ属性
function editableAttrs(editable: boolean) {
  return editable ? { role: 'button', tabindex: 0 } : {};
}

// チップタップ時（編集可能なチップのみ cellClick を発火）
function onChipClick(memberId: string, dateId: string) {
  if (isChipEditable(memberId)) emit('cellClick', memberId, dateId);
}

// 自分の回答行タップ時
function onMyAnswerClick(dateId: string) {
  if (isMyAnswerEditable.value && props.myMemberId)
    emit('cellClick', props.myMemberId, dateId);
}

// キーボード操作（Enter・Space で cellClick を発火）
function onChipKeydown(e: KeyboardEvent, memberId: string, dateId: string) {
  if (!isChipEditable(memberId)) return;
  if (e.key === 'Enter' || e.key === ' ') {
    e.preventDefault();
    emit('cellClick', memberId, dateId);
  }
}

function onMyAnswerKeydown(e: KeyboardEvent, dateId: string) {
  if (!isMyAnswerEditable.value || !props.myMemberId) return;
  if (e.key === 'Enter' || e.key === ' ') {
    e.preventDefault();
    emit('cellClick', props.myMemberId, dateId);
  }
}
</script>

<template>
  <div v-if="hasDates" class="card-list">
    <p v-if="isEditing" class="edit-hint">{{ editHint }}</p>
    <div v-for="date in availabilityDates" :key="date.id" class="card">
      <div class="card-header">
        <input
          v-if="canConfirm"
          type="radio"
          name="confirm-date-card"
          :value="date.id"
          :checked="selectedDateId === date.id"
          :aria-label="`${formatDateWithWeekday(date.date)} を確定`"
          @change="emit('dateSelect', date.id)"
        />
        <span class="card-date">{{ formatDateWithWeekday(date.date) }}</span>
        <span v-if="date.timeNote" class="time-note">
          <Clock :size="11" />
          {{ date.timeNote }}
        </span>
      </div>

      <div class="chips">
        <span
          v-for="member in members"
          :key="member.id"
          class="chip"
          :class="[
            chipAnswerClass(date, member.id),
            { 'chip--editing': isChipEditable(member.id) },
          ]"
          v-bind="editableAttrs(isChipEditable(member.id))"
          @click="onChipClick(member.id, date.id)"
          @keydown="onChipKeydown($event, member.id, date.id)"
        >
          <UserAvatar
            :size="20"
            :user-id="member.userId"
            :name="memberBaseName(member)"
          />
          <span class="chip-name" :title="memberDisplayName(member)">{{
            memberDisplayName(member)
          }}</span>
          <AnswerCell :answer="getAnswer(date, member.id)" />
        </span>
      </div>

      <div
        v-if="myMemberId"
        class="my-answer"
        :class="{ 'my-answer--editing': isMyAnswerEditable }"
        v-bind="editableAttrs(isMyAnswerEditable)"
        @click="onMyAnswerClick(date.id)"
        @keydown="onMyAnswerKeydown($event, date.id)"
      >
        <span class="my-answer-label">あなたの回答：</span>
        <AnswerCell :answer="myAnswer(date)" />
      </div>
    </div>
  </div>
  <div v-else class="empty">候補日が登録されていません</div>
</template>

<style scoped>
.card-list {
  display: flex;
  flex-direction: column;
  gap: var(--space-3);
}

.edit-hint {
  margin: 0;
  font-size: 12px;
  color: var(--color-text-secondary);
}

.card {
  border: 1px solid var(--color-border);
  border-radius: var(--radius-md);
  padding: var(--space-3) var(--space-4);
  background: var(--color-surface);
}

.card-header {
  display: flex;
  align-items: center;
  flex-wrap: wrap;
  gap: var(--space-2);
}

.time-note {
  display: inline-flex;
  align-items: center;
  gap: 4px;
  padding: 2px var(--space-2);
  border-radius: var(--radius-full);
  background: var(--color-surface-muted);
  color: var(--color-text-secondary);
  font-size: 12px;
  font-weight: 500;
}

.card-date {
  font-size: 14px;
  font-weight: 500;
  color: var(--color-text);
}

.chips {
  display: flex;
  flex-wrap: wrap;
  gap: var(--space-2);
  margin-top: var(--space-3);
}

.chip {
  display: inline-flex;
  align-items: center;
  gap: var(--space-1);
  padding: 2px var(--space-2) 2px 2px;
  border: 2px solid var(--color-border);
  border-radius: var(--radius-full);
  font-size: 12px;
  color: var(--color-text);
  background: var(--color-surface);
}

.chip-name {
  max-width: 8em;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.chip--ok {
  border-color: var(--color-success, #16a34a);
}

.chip--maybe {
  border-color: var(--color-warning, #ca8a04);
}

.chip--ng {
  border-color: var(--color-error, #dc2626);
}

.chip--none {
  opacity: 0.45;
}

.chip--editing {
  cursor: pointer;
  background: color-mix(in srgb, var(--color-primary) 5%, var(--color-surface));
}

.chip--editing:focus-visible {
  outline: 2px solid var(--color-primary);
  outline-offset: 1px;
}

.my-answer {
  display: flex;
  align-items: center;
  gap: var(--space-1);
  margin-top: var(--space-3);
  padding-top: var(--space-2);
  border-top: 1px dashed var(--color-border);
  font-size: 13px;
  color: var(--color-text-secondary);
}

.my-answer--editing {
  cursor: pointer;
  border-radius: var(--radius-md);
  background: color-mix(in srgb, var(--color-primary) 5%, var(--color-surface));
}

.my-answer--editing:focus-visible {
  outline: 2px solid var(--color-primary);
  outline-offset: 1px;
}

.empty {
  text-align: center;
  color: var(--color-text-muted);
  font-size: 14px;
  padding: var(--space-6) var(--space-4);
  border: 1px solid var(--color-border);
  border-radius: var(--radius-md);
}
</style>
