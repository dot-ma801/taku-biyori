<script setup lang="ts">
import { memberDisplayName } from '@/utils/memberDisplayName';
import { formatDateWithWeekday } from '@/utils/date';
import type { LobbyMember } from '@taku-biyori/shared';
import { computed } from 'vue';

const props = defineProps<{
  selectedDate: {
    id: string;
    date: string;
    dateNote: string | null;
    counts: { ok: number; maybe: number; ng: number };
  } | null;
  selectedMembers: LobbyMember[];
}>();

const dateLabel = computed(() =>
  props.selectedDate ? formatDateWithWeekday(props.selectedDate.date) : '-',
);

const dateNote = computed(() => props.selectedDate?.dateNote ?? null);
</script>

<template>
  <div class="review">
    <div class="review-row">
      <span class="review-label">開催日</span>
      <span class="review-value">{{ dateLabel }}</span>
      <span v-if="dateNote" class="review-note-text">{{ dateNote }}</span>
    </div>
    <div class="review-row">
      <span class="review-label"
        >参加者（{{ selectedMembers.length }} 名）</span
      >
      <ul class="review-members">
        <li
          v-for="member in selectedMembers"
          :key="member.id"
          class="review-member"
        >
          {{ memberDisplayName(member) }}
        </li>
      </ul>
    </div>
    <p class="review-note">確定後は取り消せません。よろしいですか？</p>
  </div>
</template>

<style scoped>
.review {
  display: flex;
  flex-direction: column;
  gap: var(--space-4);
  font-size: 14px;
}

.review-row {
  display: flex;
  flex-direction: column;
  gap: var(--space-1);
}

.review-label {
  font-weight: 500;
  font-size: 12px;
  color: var(--color-text-muted);
  text-transform: uppercase;
  letter-spacing: 0.05em;
}

.review-value {
  font-size: 16px;
  font-weight: 500;
}

.review-note-text {
  font-size: 13px;
  color: var(--color-text-secondary);
}

.review-members {
  list-style: none;
  margin: 0;
  padding: 0;
  display: flex;
  flex-direction: column;
  gap: var(--space-1);
}

.review-member::before {
  content: '・';
  color: var(--color-text-muted);
}

.review-note {
  font-size: 13px;
  color: var(--color-text-muted);
  margin: 0;
}
</style>
