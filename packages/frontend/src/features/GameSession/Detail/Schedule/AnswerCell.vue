<script setup lang="ts">
import type { Answer } from '@/features/GameSession/Detail/Schedule/types';
import { Circle, Triangle, X } from '@lucide/vue';

defineProps<{
  answer: Answer | null;
}>();

const ICON = { ok: Circle, maybe: Triangle, ng: X } as const;
const ICON_SIZE = 16;

const ARIA_LABEL: Record<Answer, string> = {
  ok: '参加できる',
  maybe: '調整できる',
  ng: '不可',
};
</script>

<template>
  <component
    :is="ICON[answer]"
    v-if="answer"
    :size="ICON_SIZE"
    :class="`answer-icon answer-icon--${answer}`"
    :aria-label="ARIA_LABEL[answer]"
  />
  <span v-else class="answer-empty" aria-label="未回答" />
</template>

<style scoped>
.answer-icon--ok {
  color: var(--resp-maru, #5c9448);
}

.answer-icon--maybe {
  color: var(--resp-sankaku, #dd9d24);
}

.answer-icon--ng {
  color: var(--resp-batsu, #d34a43);
}

.answer-empty {
  display: inline-block;
  width: 16px;
  height: 16px;
}
</style>
