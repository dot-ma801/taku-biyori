<script setup lang="ts">
import type { LobbyAvailabilityDate, LobbyMember } from '@taku-biyori/shared';
import AnswerCell from '@/features/Lobby/Detail/Schedule/AnswerCell.vue';
import { useScheduleView } from '@/features/Lobby/Detail/Schedule/useScheduleView';
import { useScheduleEditHint } from '@/features/Lobby/Detail/Schedule/useScheduleEditHint';
import type { Answer } from '@/features/Lobby/Detail/Schedule/types';
import { formatDateWithWeekday } from '@/utils/date';
import { memberDisplayName } from '@/utils/memberDisplayName';
import { computed, toRef } from 'vue';

const props = defineProps<{
  availabilityDates: LobbyAvailabilityDate[];
  members: LobbyMember[];
  myMemberId: string | null;
  // いま編集可能なメンバー列の id 一覧
  editableMemberIds: string[];
  // 編集中ドラフト。`${memberId}::${dateId}` → 回答
  draftAnswers: Map<string, Answer>;
}>();

const emit = defineEmits<{
  cellClick: [memberId: string, dateId: string];
}>();

const { getAnswer, hasAnyDateNote } = useScheduleView(
  toRef(props, 'editableMemberIds'),
  toRef(props, 'draftAnswers'),
  toRef(props, 'availabilityDates'),
);

const { isEditing, editHint } = useScheduleEditHint(
  () => props.editableMemberIds,
  () => props.myMemberId,
  'table',
);

// 空行の colspan（候補日列 + ひとこと列? + メンバー列）
const emptyRowColspan = computed(
  () => props.members.length + 1 + (hasAnyDateNote.value ? 1 : 0),
);

// 自分のメンバーかどうか判定（「（あなた）」ラベル表示用）
function isMe(member: LobbyMember): boolean {
  return member.id === props.myMemberId;
}

// このメンバー列のセルがいま編集可能か
function isCellEditable(member: LobbyMember): boolean {
  return props.editableMemberIds.includes(member.id);
}

// 編集可能なセルに付与するアクセシビリティ属性
function editableCellAttrs(member: LobbyMember) {
  return isCellEditable(member) ? { role: 'button', tabindex: 0 } : {};
}

// セルクリック時（編集可能なセルのみ cellClick を発火）
function onCellClick(member: LobbyMember, dateId: string) {
  if (isCellEditable(member)) emit('cellClick', member.id, dateId);
}

// キーボード操作でセルを選択（Enter・Space で cellClick を発火）
function onCellKeydown(e: KeyboardEvent, member: LobbyMember, dateId: string) {
  if (!isCellEditable(member)) return;
  if (e.key === 'Enter' || e.key === ' ') {
    e.preventDefault();
    emit('cellClick', member.id, dateId);
  }
}
</script>

<template>
  <p v-if="isEditing" class="edit-hint">{{ editHint }}</p>
  <div class="table-wrapper">
    <table class="table">
      <thead>
        <tr>
          <th scope="col" class="th th--date">候補日程</th>
          <th v-if="hasAnyDateNote" scope="col" class="th th--note">
            ひとこと
          </th>
          <th
            v-for="member in members"
            :key="member.id"
            scope="col"
            class="th th--member"
          >
            {{ memberDisplayName(member) }}
            <span v-if="isMe(member)" class="you-label">（あなた）</span>
          </th>
        </tr>
      </thead>
      <tbody>
        <tr v-for="date in availabilityDates" :key="date.id" class="tr">
          <td class="td td--date">{{ formatDateWithWeekday(date.date) }}</td>
          <td v-if="hasAnyDateNote" class="td td--note">
            <span class="note-text">{{ date.dateNote }}</span>
          </td>
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
.edit-hint {
  margin: 0 0 var(--space-2);
  font-size: 12px;
  color: var(--color-text-secondary);
}

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

.th--date {
  text-align: left;
  width: 1%;
  left: 0;
  z-index: 2;
}

/*
 * ひとこと列は sticky にしない。左端に固定するのは候補日程列だけに保ち、
 * 横スクロール時にメンバー列へ使える幅を狭めないため。
 *
 * width: 1% は「内容ぶんまで縮める」指定（候補日程列と同じ手）。これが無いと
 * table-layout: auto が余った幅を最大幅の列＝ひとこと列に寄せてしまい、
 * メンバーが少ないときにこの列だけが極端に広がる。折り返し幅の上限は
 * td ではなく内側の span に持たせる（td の max-width は幅配分に効かないため）。
 */
.th--note,
.td--note {
  width: 1%;
  /* 候補日程列と同じく、右に区切り線を引いて回答（メンバー列）と切り分ける */
  border-right: 1px solid var(--color-border);
}

.th--note {
  text-align: center;
}

.td--note {
  text-align: left;
}

/*
 * 幅は max-width ではなく width で決め打ちする。td の width: 1%（内容ぶんまで縮める）
 * と組み合わせると、この span の幅がそのまま列の min-content になるため、
 * 列幅がひとことの文字数に左右されなくなる（短くても長くても 12em）。
 */
.note-text {
  display: inline-block;
  width: 12em;
  font-size: 12px;
  color: var(--color-text-secondary);
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

.td--empty {
  text-align: center;
  color: var(--color-text-muted);
  padding: var(--space-6) var(--space-4);
}
</style>
