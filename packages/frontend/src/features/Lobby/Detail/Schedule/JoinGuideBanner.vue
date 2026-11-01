<script setup lang="ts">
import { onMounted, useTemplateRef } from 'vue';
import { SquarePen } from '@lucide/vue';
import BaseAlert from '@/components/common/BaseAlert/BaseAlert.vue';
import BaseButton from '@/components/button/BaseButton.vue';

defineProps<{
  unansweredCount: number;
  // 「◯△× を付ける」を出すか（回答できて、まだ編集に入っていないとき）
  canStartAnswer: boolean;
}>();

const emit = defineEmits<{
  answer: [];
  dismiss: [];
}>();

const root = useTemplateRef<HTMLElement>('root');

// スマホでは参加ボタンの下にタブがあるため、出た時点で案内まで送る
onMounted(() => {
  root.value?.scrollIntoView?.({ behavior: 'smooth', block: 'start' });
});
</script>

<template>
  <div ref="root" class="join-guide">
    <BaseAlert variant="success" dismissible @dismiss="emit('dismiss')">
      <p class="join-guide__message">
        参加ありがとう！次は都合のいい日に ◯△× を付けてね
      </p>
      <p class="join-guide__count">未回答 {{ unansweredCount }}件</p>
      <BaseButton
        v-if="canStartAnswer"
        class="join-guide__action"
        :left-icon="SquarePen"
        @click="emit('answer')"
      >
        ◯△× を付ける
      </BaseButton>
    </BaseAlert>
  </div>
</template>

<style scoped>
.join-guide {
  margin-bottom: var(--space-4);
  scroll-margin-top: var(--space-4);
}

.join-guide__message {
  margin: 0;
  font-weight: 500;
}

.join-guide__count {
  margin: var(--space-1) 0 0;
  font: var(--text-caption);
  color: var(--text-secondary);
}

.join-guide__action {
  margin-top: var(--space-3);
}
</style>
