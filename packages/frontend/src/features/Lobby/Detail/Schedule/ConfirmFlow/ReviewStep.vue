<script setup lang="ts">
import BaseTextArea from '@/components/form/BaseTextArea/BaseTextArea.vue';
import BaseTextBox from '@/components/form/BaseTextBox/BaseTextBox.vue';
import type { GameSessionDraft } from '@/features/Lobby/Detail/Schedule/ConfirmFlow/useConfirmFlow';
import type { LobbyEntryModel } from '@/models/lobby';
import { formatDateWithWeekday } from '@/utils/date';
import { memberDisplayName } from '@/utils/memberDisplayName';
import { computed } from 'vue';

const props = defineProps<{
  scheduledAt: string;
  selectedEntries: LobbyEntryModel[];
  draft: GameSessionDraft;
}>();
const emit = defineEmits<{ 'update:draft': [draft: GameSessionDraft] }>();
const dateLabel = computed(() => formatDateWithWeekday(props.scheduledAt));

function update<K extends keyof GameSessionDraft>(
  key: K,
  value: GameSessionDraft[K],
) {
  emit('update:draft', { ...props.draft, [key]: value });
}
</script>

<template>
  <div class="review">
    <div>
      <span class="label">開催日</span>
      <p class="date">{{ dateLabel }}</p>
    </div>
    <div>
      <span class="label">参加者（{{ selectedEntries.length }}名）</span>
      <ul>
        <li v-for="entry in selectedEntries" :key="entry.id">
          {{ memberDisplayName(entry) }}
        </li>
      </ul>
    </div>
    <p class="hint">空欄の項目はロビーの設定をそのまま使います。</p>
    <BaseTextBox
      :model-value="draft.title"
      label="開催名（任意）"
      @update:model-value="update('title', $event)"
    />
    <BaseTextBox
      :model-value="draft.scenarioName"
      label="シナリオ名（任意）"
      @update:model-value="update('scenarioName', $event)"
    />
    <BaseTextBox
      :model-value="draft.location"
      label="開催場所（任意）"
      @update:model-value="update('location', $event)"
    />
    <BaseTextBox
      :model-value="draft.timeLabel"
      label="時刻・ひとこと（任意）"
      @update:model-value="update('timeLabel', $event)"
    />
    <BaseTextArea
      :model-value="draft.description"
      label="当日の連絡事項（任意）"
      :rows="3"
      @update:model-value="update('description', $event)"
    />
  </div>
</template>

<style scoped>
.review {
  display: flex;
  flex-direction: column;
  gap: var(--space-4);
  font-size: 14px;
}
.label {
  font-size: 12px;
  font-weight: 500;
  color: var(--color-text-muted);
}
.date {
  margin: var(--space-1) 0 0;
  font-size: 16px;
  font-weight: 500;
}
ul {
  margin: var(--space-1) 0 0;
  padding-left: 1.2em;
}
.hint {
  margin: 0;
  color: var(--color-text-muted);
  font-size: 13px;
}
</style>
