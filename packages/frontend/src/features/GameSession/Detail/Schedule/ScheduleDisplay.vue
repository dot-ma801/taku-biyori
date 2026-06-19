<script setup lang="ts">
import BaseCard from '@/components/common/BaseCard/BaseCard.vue';
import BaseSectionHeading from '@/components/common/BaseSectionHeading/BaseSectionHeading.vue';
import BaseButton from '@/components/button/BaseButton.vue';
import ScheduleTable from '@/features/GameSession/Detail/Schedule/ScheduleTable.vue';
import { useSchedule } from '@/features/GameSession/Detail/Schedule/useSchedule';
import type { GameSession, GameSessionDetail } from '@taku-biyori/shared';
import { useSession } from '@/lib/auth';
import { CalendarCheck, SquarePen, Check, RotateCcw } from '@lucide/vue';
import { computed, ref, onMounted, onUnmounted } from 'vue';
import { useScheduleConfirm } from '@/features/GameSession/Detail/Schedule/useScheduleConfirm';

const props = defineProps<{
  gameSession: GameSessionDetail;
}>();

const emit = defineEmits<{
  'session-updated': [updated: GameSession];
}>();

// useSession は nanostores の Atom なので Vue の ref に変換する
const sessionData = ref(useSession.get());
let unsubscribeSession: (() => void) | undefined;

onMounted(() => {
  unsubscribeSession = useSession.subscribe((v) => {
    sessionData.value = v;
  });
});

onUnmounted(() => {
  unsubscribeSession?.();
});

const myMemberId = computed(
  () =>
    props.gameSession.members.find(
      (m) => m.userId === sessionData.value.data?.user?.id,
    )?.id ?? null,
);

const {
  availabilityDates,
  loading,
  errorMessage,
  isEditing,
  draftAnswers,
  enterEditMode,
  cycleAnswer,
  submitEdit,
} = useSchedule(props.gameSession.id, myMemberId);

const selectedDateId = ref<string | null>(null);

const {
  canConfirm,
  loading: loadingScheduleConfirm,
  confirmDate,
} = useScheduleConfirm(
  props.gameSession.id,
  () => props.gameSession.createdBy,
  () => props.gameSession.status,
  (updated) => emit('session-updated', updated),
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
    <template v-else>
      <ScheduleTable
        :availability-dates="availabilityDates"
        :members="props.gameSession.members"
        :my-member-id="myMemberId"
        :is-editing="isEditing"
        :draft-answers="draftAnswers"
        :can-confirm="canConfirm"
        :selected-date-id="selectedDateId"
        @cell-click="cycleAnswer"
        @date-select="(id) => (selectedDateId = id)"
      />
      <div v-if="myMemberId" class="actions">
        <template v-if="!isEditing">
          <BaseButton
            v-if="canConfirm && selectedDateId"
            variant="secondary"
            :left-icon="RotateCcw"
            class="reset-btn"
            @click="selectedDateId = null"
          >
            選択を解除
          </BaseButton>
          <BaseButton variant="secondary" :left-icon="SquarePen" @click="enterEditMode">
            回答を編集する
          </BaseButton>
          <BaseButton
            v-if="canConfirm"
            :loading="loadingScheduleConfirm"
            :left-icon="CalendarCheck"
            :disabled="!selectedDateId"
            @click="selectedDateId && confirmDate(selectedDateId)"
          >
            開催日を確定
          </BaseButton>
        </template>
        <BaseButton v-else :left-icon="Check" @click="submitEdit">
          完了
        </BaseButton>
      </div>
    </template>
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

.actions {
  display: flex;
  justify-content: flex-end;
  margin-top: var(--space-3);
  > * {
    margin: 0 var(--space-1);
  }
}

.reset-btn {
  margin-right: auto;
}
</style>
