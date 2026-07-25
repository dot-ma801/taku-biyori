<script setup lang="ts">
import type { AvailabilityDate, GameSessionMember } from '@taku-biyori/shared';
import AnswerCell from '@/features/GameSession/Detail/Schedule/AnswerCell.vue';
import { useScheduleView } from '@/features/GameSession/Detail/Schedule/useScheduleView';
import type { Answer } from '@/features/GameSession/Detail/Schedule/types';
import { formatDateWithWeekday } from '@/utils/date';
import { memberDisplayName } from '@/utils/memberDisplayName';
import { computed, toRef } from 'vue';

const props = defineProps<{
  availabilityDates: AvailabilityDate[];
  members: GameSessionMember[];
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

const { getAnswer, okCount } = useScheduleView(
  toRef(props, 'editableMemberIds'),
  toRef(props, 'draftAnswers'),
);

// 空行の colspan（確定列? + 候補日列 + メンバー列 + 集計列）
const emptyRowColspan = computed(
  () => props.members.length + 2 + (props.canConfirm ? 1 : 0),
);

// 自分のメンバーかどうか判定（「（あなた）」ラベル表示用）
function isMe(member: GameSessionMember): boolean {
  return member.id === props.myMemberId;
}

// このメンバー列のセルがいま編集可能か
function isCellEditable(member: GameSessionMember): boolean {
  return props.editableMemberIds.includes(member.id);
}

// 編集可能なセルに付与するアクセシビリティ属性
function editableCellAttrs(member: GameSessionMember) {
  return isCellEditable(member) ? { role: 'button', tabindex: 0 } : {};
}

// セルクリック時（編集可能なセルのみ cellClick を発火）
function onCellClick(member: GameSessionMember, dateId: string) {
  if (isCellEditable(member)) emit('cellClick', member.id, dateId);
}

// キーボード操作でセルを選択（Enter・Space で cellClick を発火）
function onCellKeydown(
  e: KeyboardEvent,
  member: GameSessionMember,
  dateId: string,
) {
  if (!isCellEditable(member)) return;
  if (e.key === 'Enter' || e.key === ' ') {
    e.preventDefault();
    emit('cellClick', member.id, dateId);
  }
}
</script>

<template>
  <div class="table-wrapper">
    <table class="table">
      <thead>
        <tr>
          <th v-if="canConfirm" scope="col" class="th th--confirm">確定</th>
          <th scope="col" class="th th--date">候補日程</th>
          <th
            v-for="member in members"
            :key="member.id"
            scope="col"
            class="th th--member"
          >
            {{ memberDisplayName(member) }}
            <span v-if="isMe(member)" class="you-label">（あなた）</span>
          </th>
          <th scope="col" class="th th--tally">◯ 集計</th>
        </tr>
      </thead>
      <tbody>
        <tr v-for="date in availabilityDates" :key="date.id" class="tr">
          <td v-if="canConfirm" class="td td--confirm">
            <input
              type="radio"
              name="confirm-date"
              :value="date.id"
              :checked="selectedDateId === date.id"
              :aria-label="`${formatDateWithWeekday(date.date)} を確定`"
              @change="emit('dateSelect', date.id)"
            />
          </td>
          <td class="td td--date">{{ formatDateWithWeekday(date.date) }}</td>
          <td
            v-for="member in members"
            :key="member.id"
            class="td td--answer"
            :class="{ 'td--editing': isCellEditable(member) }"
            v-bind="editableCellAttrs(member)"
            @click="onCellClick(member, date.id)"
            @keydown="onCellKeydown($event, member, date.id)"
          >
            <AnswerCell :answer="getAnswer(date, member.id)" />
          </td>
          <td class="td td--tally">
            <span class="tally">
              <b>{{ okCount(date, members) }}</b
              ><span>/{{ members.length }}</span>
            </span>
          </td>
        </tr>
        <tr v-if="availabilityDates.length === 0">
          <td :colspan="emptyRowColspan" class="td td--empty">
            候補日が登録されていません
          </td>
        </tr>
      </tbody>
    </table>
  </div>
</template>

<style scoped>
.table-wrapper {
  width: 100%;
  overflow-x: auto;
  border: 1px solid var(--color-border);
  border-radius: var(--radius-md);
}

.table {
  width: 100%;
  border-collapse: collapse;
  font-size: 14px;
  color: var(--color-text);
}

.th {
  padding: var(--space-3) var(--space-4);
  font-size: 13px;
  font-weight: 500;
  color: var(--color-text-secondary);
  background: var(--color-surface-raised);
  border-bottom: 1px solid var(--color-border);
  white-space: nowrap;
  position: sticky;
  top: 0;
  z-index: 1;
}

.th--confirm {
  text-align: center;
  width: 1%;
  white-space: nowrap;
}

.td--confirm {
  text-align: center;
}

.th--date {
  text-align: left;
  width: 1%;
  left: 0;
  z-index: 2;
}

.th--member {
  text-align: center;
}

.you-label {
  font-size: 11px;
  font-weight: 400;
  color: var(--color-text-muted);
  display: block;
}

.tr {
  border-bottom: 1px solid var(--color-border);
}

.tr:last-child {
  border-bottom: none;
}

.td {
  padding: var(--space-3) var(--space-4);
}

.td--date {
  white-space: nowrap;
  position: sticky;
  left: 0;
  background: var(--color-surface);
  border-right: 1px solid var(--color-border);
}

.td--answer {
  text-align: center;
}

.td--editing {
  background: color-mix(in srgb, var(--color-primary) 5%, var(--color-surface));
  cursor: pointer;
}

.td--editing:hover {
  background: color-mix(
    in srgb,
    var(--color-primary) 10%,
    var(--color-surface)
  );
}

.td--editing:focus-visible {
  outline: 2px solid var(--color-primary);
  outline-offset: -2px;
}

.th--tally {
  text-align: center;
  width: 1%;
  white-space: nowrap;
}

.td--tally {
  text-align: center;
  white-space: nowrap;
}

.tally {
  font-size: 13px;
  color: var(--color-text-secondary);
}

.tally b {
  font-weight: 700;
  color: var(--color-text);
}

.td--empty {
  text-align: center;
  color: var(--color-text-muted);
  padding: var(--space-6) var(--space-4);
}
</style>
