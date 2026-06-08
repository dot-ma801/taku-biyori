<script setup lang="ts">
import type { AvailabilityDate, GameSessionMember } from '@taku-biyori/shared';
import AnswerCell from '@/features/GameSession/Detail/Schedule/AnswerCell.vue';
import { useScheduleView } from '@/features/GameSession/Detail/Schedule/useScheduleView';
import type { Answer } from '@/features/GameSession/Detail/Schedule/types';
import { formatDateWithWeekday } from '@/utils/date';
import { toRef } from 'vue';

const props = defineProps<{
  availabilityDates: AvailabilityDate[];
  members: GameSessionMember[];
  myMemberId: string | null;
  isEditing: boolean;
  draftAnswers: Map<string, Answer>;
}>();

const emit = defineEmits<{
  cellClick: [dateId: string];
}>();

const { getAnswer, okCount } = useScheduleView(
  toRef(props, 'myMemberId'),
  toRef(props, 'isEditing'),
  toRef(props, 'draftAnswers'),
);

function memberDisplayName(member: GameSessionMember): string {
  return member.userName ?? member.guestName ?? '（未設定）';
}

function onCellKeydown(e: KeyboardEvent, dateId: string) {
  if (e.key === 'Enter' || e.key === ' ') {
    e.preventDefault();
    emit('cellClick', dateId);
  }
}
</script>

<template>
  <div class="table-wrapper">
    <table class="table">
      <thead>
        <tr>
          <th scope="col" class="th th--date">候補日程</th>
          <th
            v-for="member in members"
            :key="member.id"
            scope="col"
            class="th th--member"
          >
            {{ memberDisplayName(member) }}
            <span v-if="member.id === myMemberId" class="you-label"
              >（あなた）</span
            >
          </th>
          <th scope="col" class="th th--tally">◯ 集計</th>
        </tr>
      </thead>
      <tbody>
        <tr v-for="date in availabilityDates" :key="date.id" class="tr">
          <td class="td td--date">{{ formatDateWithWeekday(date.date) }}</td>
          <td
            v-for="member in members"
            :key="member.id"
            class="td td--answer"
            :class="{ 'td--editing': member.id === myMemberId && isEditing }"
            v-bind="
              member.id === myMemberId && isEditing
                ? { role: 'button', tabindex: 0 }
                : {}
            "
            @click="
              member.id === myMemberId && isEditing
                ? emit('cellClick', date.id)
                : undefined
            "
            @keydown="
              member.id === myMemberId && isEditing
                ? onCellKeydown($event, date.id)
                : undefined
            "
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
          <td :colspan="members.length + 2" class="td td--empty">
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
  font-weight: 600;
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
