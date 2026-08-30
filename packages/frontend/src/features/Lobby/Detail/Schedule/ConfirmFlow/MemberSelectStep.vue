<script setup lang="ts">
import BaseCheckbox from '@/components/form/BaseCheckbox/BaseCheckbox.vue';
import AnswerCell from '@/features/Lobby/Detail/Schedule/AnswerCell.vue';
import type { Answer } from '@/features/Lobby/Detail/Schedule/types';
import type { LobbyEntryModel } from '@/models/lobby';
import { memberDisplayName } from '@/utils/memberDisplayName';
import { AlertTriangle } from '@lucide/vue';

const props = defineProps<{
  entries: LobbyEntryModel[];
  selectedEntryIds: Set<string>;
  isWarnedEntry: (entryId: string) => boolean;
  getEntryAnswer: (entryId: string) => Answer | null;
}>();
const emit = defineEmits<{ toggle: [id: string] }>();
</script>

<template>
  <p class="step-label">参加者を選んでください</p>
  <ul class="entry-list">
    <li v-for="entry in entries" :key="entry.id" class="entry-item">
      <label class="entry-label">
        <BaseCheckbox
          :model-value="selectedEntryIds.has(entry.id)"
          @update:model-value="emit('toggle', entry.id)"
        />
        <span class="entry-name">{{ memberDisplayName(entry) }}</span>
        <AnswerCell :answer="props.getEntryAnswer(entry.id)" />
        <span v-if="props.isWarnedEntry(entry.id)" class="warn"
          ><AlertTriangle :size="14" />×・未回答</span
        >
      </label>
    </li>
  </ul>
</template>

<style scoped>
.step-label {
  font-size: 13px;
  color: var(--color-text-muted);
  margin: 0 0 var(--space-3);
}
.entry-list {
  list-style: none;
  margin: 0;
  padding: 0;
  display: flex;
  flex-direction: column;
  gap: var(--space-2);
}
.entry-item {
  padding: var(--space-2) var(--space-3);
  border: 1px solid var(--color-border);
  border-radius: var(--radius-md);
}
.entry-label {
  display: flex;
  align-items: center;
  gap: var(--space-2);
  cursor: pointer;
  font-size: 14px;
  width: 100%;
}
.entry-name {
  flex: 1;
}
.warn {
  display: flex;
  align-items: center;
  gap: var(--space-1);
  font-size: 12px;
  color: var(--color-warning, #bf8700);
}
</style>
