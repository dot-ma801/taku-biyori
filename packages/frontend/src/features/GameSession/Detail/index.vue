<script setup lang="ts">
defineOptions({ name: 'GameSessionDetail' });
import BaseSectionHeading from '@/components/common/BaseSectionHeading/BaseSectionHeading.vue';
import MemberDisplay from '@/features/GameSession/Detail/MemberDisplay.vue';
import MemoDisplay from '@/features/GameSession/Detail/MemoDisplay.vue';
import SessionActionBar from '@/features/GameSession/Detail/SessionActionBar.vue';
import StatusDisplay from '@/features/GameSession/Detail/StatusDisplay.vue';
import { useGetGameSessionDetail } from '@/features/GameSession/Detail/useGetGameSessionDetail';
import { computed } from 'vue';
import { Album, UsersRound, CalendarDays } from '@lucide/vue';

const props = defineProps<{ gameSessionId: string }>();

const {
  gameSession,
  loading: loadingDetail,
  errorMessage,
  fetch,
  updateMember,
} = useGetGameSessionDetail(props.gameSessionId);

// NOTE: UIの関心事なので、composable ではなくコンポーネント側に定義する
const scenarioName = computed(
  () => gameSession.value?.scenarioName ?? '未設定',
);
const maxMembers = computed(() => gameSession.value?.maxMembers ?? '未設定');
const description = computed(() => gameSession.value?.description ?? undefined);
const gameSessionDateTime = computed(
  () => gameSession.value?.scheduledAt ?? '未設定',
);
</script>

<template>
  <div v-if="loadingDetail">読み込み中...</div>
  <div v-else-if="errorMessage">{{ errorMessage }}</div>

  <div v-else-if="gameSession" class="container">
    <div>
      <BaseSectionHeading level="h1">
        {{ gameSession.title }}
      </BaseSectionHeading>

      <div class="session-meta-bar">
        <div class="description">
          <Album :size="16" />
          <p>シナリオ：{{ scenarioName }}</p>
          <CalendarDays :size="16" />
          <p>日時：{{ gameSessionDateTime }}</p>
          <UsersRound :size="16" />
          <p>募集人数: {{ maxMembers }}</p>
        </div>

        <div class="action-bar-wrapper">
          <SessionActionBar
            :game-session-id="props.gameSessionId"
            :game-session="gameSession"
            @session-changed="fetch"
          />
        </div>
      </div>
    </div>

    <!-- TODO: シナリオ詳細文が実装されたら表示する -->
    <StatusDisplay :game-session-status="gameSession.status" />
    <MemoDisplay :text="description" />
    <MemberDisplay :game-session="gameSession" @member-updated="updateMember" />
  </div>
</template>

<style scoped>
.container {
  display: flex;
  flex-direction: column;
  gap: var(--space-5);
}

.session-meta-bar {
  display: flex;
  justify-content: space-between;

  .description {
    display: grid;
    grid-template-columns: auto 1fr;
    grid-template-rows: 1fr 1fr;
    align-items: center;

    gap: 0 var(--space-1);
    padding-left: var(--space-3);
  }

  @media (max-width: 780px) {
    flex-direction: column;
    gap: var(--space-4) 0;

    .description {
      padding-left: 0;
    }

    .action-bar-wrapper {
      align-self: flex-end;
    }
  }
}
</style>
