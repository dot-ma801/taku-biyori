<script setup lang="ts">
import BaseCard from '@/components/common/BaseCard/BaseCard.vue';
import BaseSectionHeading from '@/components/common/BaseSectionHeading/BaseSectionHeading.vue';
import BaseButton from '@/components/button/BaseButton.vue';
import ScheduleTable from '@/features/GameSession/Detail/Schedule/ScheduleTable.vue';
import { useSchedule } from '@/features/GameSession/Detail/Schedule/useSchedule';
import type { GameSessionMember } from '@taku-biyori/shared';
import { useSession } from '@/lib/auth';
import { CalendarCheck, SquarePen, Check } from '@lucide/vue';
import { computed, ref, onMounted, onUnmounted } from 'vue';

const props = defineProps<{
  gameSessionId: string;
  members: GameSessionMember[];
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
    props.members.find((m) => m.userId === sessionData.value.data?.user?.id)
      ?.id ?? null,
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
} = useSchedule(props.gameSessionId, myMemberId);
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
        :members="members"
        :my-member-id="myMemberId"
        :is-editing="isEditing"
        :draft-answers="draftAnswers"
        @cell-click="cycleAnswer"
      />
      <div v-if="myMemberId" class="actions">
        <BaseButton
          v-if="!isEditing"
          variant="secondary"
          :left-icon="SquarePen"
          @click="enterEditMode"
        >
          回答を編集する
        </BaseButton>
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
}
</style>
