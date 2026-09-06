<script setup lang="ts">
import { ref } from 'vue';
import { Check } from '@lucide/vue';
import BaseButton from '@/components/button/BaseButton.vue';
import ScheduleDisplay from '@/features/Lobby/Detail/Schedule/ScheduleDisplay.vue';
import ConfirmScheduleDialog from '@/features/Table/Detail/ConfirmScheduleDialog.vue';
import { useCanOpenGameSession } from '@/features/Lobby/Detail/composables/useCanOpenGameSession';
import type { LobbyDetailModel } from '@/models/lobby';

const props = defineProps<{
  lobby: LobbyDetailModel;
  isHost: boolean;
}>();

const emit = defineEmits<{
  /** 卓の状態が動いた（確定・やり直し・回答の競合）。親に取り直しを頼む */
  changed: [];
}>();

const { canOpenGameSession } = useCanOpenGameSession(() => props.lobby);
const isConfirmOpen = ref(false);

/**
 * 確定しても別画面へは飛ばさない（#152）。
 * 親が卓を取り直すと、この画面のまま「調整中 → 開催予定」に変わる。
 */
function handleCreated() {
  emit('changed');
}
</script>

<template>
  <div class="schedule-tab">
    <ScheduleDisplay
      :lobby="lobby"
      @stale="emit('changed')"
      @restarted="emit('changed')"
    />

    <!-- 確定はホストだけ（#152） -->
    <div v-if="isHost && canOpenGameSession" class="schedule-tab__actions">
      <BaseButton :left-icon="Check" @click="isConfirmOpen = true">
        日程を確定する
      </BaseButton>
      <span class="schedule-tab__note">
        確定すると、この卓の開催日になります
      </span>
    </div>

    <ConfirmScheduleDialog
      v-model="isConfirmOpen"
      :lobby="lobby"
      @created="handleCreated"
    />
  </div>
</template>

<style scoped>
.schedule-tab {
  display: flex;
  flex-direction: column;
  gap: var(--space-4);
}

.schedule-tab__actions {
  display: flex;
  flex-wrap: wrap;
  gap: var(--space-3);
  align-items: center;
  padding-top: var(--space-4);
  border-top: var(--border-width) dashed var(--border);
}

.schedule-tab__note {
  font: var(--text-caption);
  color: var(--text-tertiary);
}
</style>
