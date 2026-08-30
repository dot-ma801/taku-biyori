<script setup lang="ts">
import BaseCollapsible from '@/components/common/BaseCollapsible/BaseCollapsible.vue';
import ScheduleTable from '@/features/Lobby/Detail/Schedule/ScheduleTable.vue';
import ScheduleCardList from '@/features/Lobby/Detail/Schedule/ScheduleCardList.vue';
import { useSchedulePollHistory } from '@/features/Lobby/Detail/Schedule/useSchedulePollHistory';
import type { Answer } from '@/features/Lobby/Detail/Schedule/types';
import { formatDateTimeShort } from '@/utils/date';
import type { LobbyEntryModel } from '@/models/lobby';
import type { SchedulePollSummaryModel } from '@/models/schedule-poll';
import { computed, ref } from 'vue';

/**
 * 過去の日程調整（最新以外）の折りたたみ表示。読み取り専用。
 * 開いたときに初めて調整を取得する（`useSchedulePollHistory` が遅延取得とキャッシュを担う）。
 *
 * 脱退した参加者の回答も表示する（過去の記録なので消さない）。そのため
 * 最新の調整（activeEntries を渡す）とは異なり `lobby.entries`（脱退者込み）を渡し、
 * `leftEntryIds` でその列をグレー表示にする。
 */

const props = defineProps<{
  lobbyId: string;
  /** lobby.schedulePolls.slice(1)。呼び出し側で0件なら描画自体しない */
  history: SchedulePollSummaryModel[];
  /** lobby.entries（脱退者込み） */
  entries: LobbyEntryModel[];
}>();

const { ensureLoaded, candidateDatesOf, isLoading, errorMessageOf } =
  useSchedulePollHistory(props.lobbyId);

/** 開いている調整の id 一覧 */
const openIds = ref<Set<string>>(new Set());

function isOpen(pollId: string): boolean {
  return openIds.value.has(pollId);
}

function onToggle(pollId: string, open: boolean) {
  const next = new Set(openIds.value);
  if (open) {
    next.add(pollId);
    void ensureLoaded(pollId);
  } else {
    next.delete(pollId);
  }
  openIds.value = next;
}

function historyTitle(poll: SchedulePollSummaryModel): string {
  return `${formatDateTimeShort(poll.createdAt.toISOString())} の調整`;
}

const leftEntryIds = computed(() =>
  props.entries.filter((entry) => entry.leftAt !== null).map((e) => e.id),
);

// 読み取り専用として渡す固定値。毎回新しいインスタンスを作らないよう定数化する
const noEditableEntryIds: string[] = [];
const emptyDraftAnswers = new Map<string, Answer>();
</script>

<template>
  <div class="history">
    <BaseCollapsible
      v-for="poll in history"
      :key="poll.id"
      :title="historyTitle(poll)"
      :model-value="isOpen(poll.id)"
      @update:model-value="onToggle(poll.id, $event)"
    >
      <p v-if="isLoading(poll.id)" class="state-message">読み込み中...</p>
      <p v-else-if="errorMessageOf(poll.id)" class="state-message error">
        {{ errorMessageOf(poll.id) }}
      </p>
      <template v-else>
        <div class="schedule-table">
          <ScheduleTable
            :candidate-dates="candidateDatesOf(poll.id)"
            :members="entries"
            :my-entry-id="null"
            :editable-entry-ids="noEditableEntryIds"
            :draft-answers="emptyDraftAnswers"
            :left-entry-ids="leftEntryIds"
          />
        </div>
        <div class="schedule-cards">
          <ScheduleCardList
            :candidate-dates="candidateDatesOf(poll.id)"
            :members="entries"
            :my-entry-id="null"
            :editable-entry-ids="noEditableEntryIds"
            :draft-answers="emptyDraftAnswers"
            :left-entry-ids="leftEntryIds"
          />
        </div>
      </template>
    </BaseCollapsible>
  </div>
</template>

<style scoped>
.history {
  display: flex;
  flex-direction: column;
  gap: var(--space-2);
}

.state-message {
  font-size: 14px;
  color: var(--color-text-muted);
  padding: var(--space-2) 0;
}

.state-message.error {
  color: var(--color-error);
}

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
