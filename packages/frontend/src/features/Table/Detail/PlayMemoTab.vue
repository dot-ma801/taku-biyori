<script setup lang="ts">
import { EyeOff } from '@lucide/vue';
import PlayMemoDisplay from '@/features/GameSession/PlayMemo/PlayMemoDisplay.vue';
import type { GameSessionDetailModel } from '@/models/game-session';

defineProps<{
  gameSession: GameSessionDetailModel | null;
}>();
</script>

<template>
  <!--
    自分のメモ／他人の公開メモ／非公開／未ログイン導線の分岐は
    PlayMemoDisplay 側が持っている（要求 §3-4）。
    ここが受け持つのは「そもそも開催が無い」ケースだけ。
  -->
  <PlayMemoDisplay v-if="gameSession" :game-session="gameSession" />
  <div v-else class="memo-empty">
    <span class="memo-empty__icon" aria-hidden="true">
      <EyeOff :size="24" />
    </span>
    <span class="memo-empty__title">プレイメモはまだありません</span>
    <p class="memo-empty__text">
      開催日が決まると、この卓のプレイメモを書けるようになります
    </p>
  </div>
</template>

<style scoped>
.memo-empty {
  display: flex;
  flex-direction: column;
  align-items: center;
  text-align: center;
  gap: var(--space-3);
  padding: var(--space-12) var(--space-5);
  background: var(--surface);
  border: var(--border-width) dashed var(--border);
  border-radius: var(--radius-card);
}

.memo-empty__icon {
  display: grid;
  place-items: center;
  width: 56px;
  height: 56px;
  border-radius: var(--radius-full);
  background: var(--surface-subtle);
  color: var(--text-tertiary);
}

.memo-empty__title {
  font: var(--text-h3);
  color: var(--text-primary);
}

.memo-empty__text {
  margin: 0;
  max-width: 380px;
  font: var(--text-body-sm);
  color: var(--text-secondary);
}
</style>
