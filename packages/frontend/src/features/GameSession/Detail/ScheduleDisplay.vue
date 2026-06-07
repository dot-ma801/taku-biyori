<script setup lang="ts">
import BaseCard from '@/components/common/BaseCard/BaseCard.vue';
import BaseSectionHeading from '@/components/common/BaseSectionHeading/BaseSectionHeading.vue';
import BaseTable from '@/components/common/BaseTable/BaseTable.vue';
import type { TableColumn } from '@/components/common/BaseTable/BaseTable.vue';
import { useScheduleDisplay } from '@/features/GameSession/Detail/useScheduleDisplay';
import type { GameSessionMember } from '@taku-biyori/shared';
import { formatDateWithWeekday } from '@/utils/date';
import { CalendarCheck } from '@lucide/vue';
import { computed } from 'vue';

const props = defineProps<{
  gameSessionId: string;
  members: GameSessionMember[];
}>();

const { availabilityDates, loading, errorMessage } = useScheduleDisplay(
  props.gameSessionId,
);

const ANSWER_LABEL: Record<string, string> = {
  ok: '◯',
  maybe: '△',
  ng: '×',
};

function memberDisplayName(member: GameSessionMember): string {
  return member.userName ?? member.guestName ?? '（未設定）';
}


const columns = computed<TableColumn[]>(() => [
  { key: 'date', label: '候補日' },
  ...props.members.map((m) => ({
    key: m.id,
    label: memberDisplayName(m),
    align: 'center' as const,
  })),
]);

type ScheduleRow = Record<string, string>;

const rows = computed<ScheduleRow[]>(() =>
  availabilityDates.value.map((d) => {
    const answerMap: Record<string, string> = {};
    for (const a of d.answers) {
      answerMap[a.memberId] = ANSWER_LABEL[a.answer] ?? '—';
    }
    return {
      date: formatDateWithWeekday(d.date),
      ...Object.fromEntries(
        props.members.map((m) => [m.id, answerMap[m.id] ?? '—']),
      ),
    };
  }),
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
    <BaseTable v-else :columns="columns" :rows="rows">
      <template #empty>候補日が登録されていません</template>
    </BaseTable>
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

/* 日付列は内容幅に収める */
:deep(th:first-child),
:deep(td:first-child) {
  width: 1%;
  white-space: nowrap;
}
</style>
