<script setup lang="ts">
import type { CandidateDateModel } from '@/models/schedule-poll';
import type { LobbyEntryModel } from '@/models/lobby';
import AnswerCell from '@/features/Lobby/Detail/Schedule/AnswerCell.vue';
import UserAvatar from '@/features/user/UserAvatar/UserAvatar.vue';
import { useScheduleView } from '@/features/Lobby/Detail/Schedule/useScheduleView';
import { useScheduleEditHint } from '@/features/Lobby/Detail/Schedule/useScheduleEditHint';
import type { Answer } from '@/features/Lobby/Detail/Schedule/types';
import { formatDateWithWeekday } from '@/utils/date';
import { memberDisplayName, memberBaseName } from '@/utils/memberDisplayName';
import { computed } from 'vue';

const props = defineProps<{
  candidateDates: CandidateDateModel[];
  members: LobbyEntryModel[];
  myEntryId: string | null;
  // いま編集可能なメンバー列の id 一覧
  editableEntryIds: string[];
  // 編集中ドラフト。`${entryId}::${dateId}` → 回答
  draftAnswers: Map<string, Answer>;
}>();

const emit = defineEmits<{
  cellClick: [entryId: string, dateId: string];
}>();

const { getAnswer } = useScheduleView(
  () => props.editableEntryIds,
  () => props.draftAnswers,
);

const { isEditing, isMyAnswerEditable, editHint } = useScheduleEditHint(
  () => props.editableEntryIds,
  () => props.myEntryId,
  'card',
);

const hasDates = computed(() => props.candidateDates.length > 0);

// チップの見た目を回答状態で切り替えるためのクラス（未回答は 'none'）
function chipAnswerClass(date: CandidateDateModel, entryId: string): string {
  const answer = getAnswer(date, entryId);
  return `chip--${answer ?? 'none'}`;
}

// 自分の回答（「あなたの回答」行の表示用）
function myAnswer(date: CandidateDateModel): Answer | null {
  if (!props.myEntryId) return null;
  return getAnswer(date, props.myEntryId);
}

// このメンバーのチップがいま編集可能か
function isChipEditable(entryId: string): boolean {
  return props.editableEntryIds.includes(entryId);
}

// 編集可能なチップ・回答行に付与するアクセシビリティ属性
function editableAttrs(editable: boolean) {
  return editable ? { role: 'button', tabindex: 0 } : {};
}

// チップタップ時（編集可能なチップのみ cellClick を発火）
function onChipClick(entryId: string, dateId: string) {
  if (isChipEditable(entryId)) emit('cellClick', entryId, dateId);
}

// 自分の回答行タップ時
function onMyAnswerClick(dateId: string) {
  if (isMyAnswerEditable.value && props.myEntryId)
    emit('cellClick', props.myEntryId, dateId);
}

// キーボード操作（Enter・Space で cellClick を発火）
function onChipKeydown(e: KeyboardEvent, entryId: string, dateId: string) {
  if (!isChipEditable(entryId)) return;
  if (e.key === 'Enter' || e.key === ' ') {
    e.preventDefault();
    emit('cellClick', entryId, dateId);
  }
}

function onMyAnswerKeydown(e: KeyboardEvent, dateId: string) {
  if (!isMyAnswerEditable.value || !props.myEntryId) return;
  if (e.key === 'Enter' || e.key === ' ') {
    e.preventDefault();
    emit('cellClick', props.myEntryId, dateId);
  }
}
</script>

<template>
  <div v-if="hasDates" class="card-list">
    <p v-if="isEditing" class="edit-hint">{{ editHint }}</p>
    <div v-for="date in candidateDates" :key="date.id" class="card">
      <div class="card-header">
        <span class="card-date">{{ formatDateWithWeekday(date.date) }}</span>
      </div>

      <!-- ひとことは日付の見出し行の外に、独立した行として置く -->
      <p v-if="date.timeLabel" class="card-note">{{ date.timeLabel }}</p>

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
        v-if="myEntryId"
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
  gap: var(--space-2);
}

.card-date {
  font-size: 14px;
  font-weight: 500;
  color: var(--color-text);
}

.card-note {
  margin: var(--space-1) 0 0;
  font-size: 12px;
  color: var(--color-text-secondary);
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
  border-color: var(--color-success);
}

.chip--maybe {
  border-color: var(--color-warning);
}

.chip--ng {
  border-color: var(--color-error);
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
