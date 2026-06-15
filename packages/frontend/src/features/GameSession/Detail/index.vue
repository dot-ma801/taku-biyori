<script setup lang="ts">
defineOptions({ name: 'GameSessionDetail' });
import BaseSectionHeading from '@/components/common/BaseSectionHeading/BaseSectionHeading.vue';
import MemberDisplay from '@/features/GameSession/Detail/MemberDisplay.vue';
import MemoDisplay from '@/features/GameSession/Detail/MemoDisplay.vue';
import ScheduleDisplay from '@/features/GameSession/Detail/Schedule/ScheduleDisplay.vue';
import { useGetGameSessionDetail } from '@/features/GameSession/Detail/useGetGameSessionDetail';
import { useGameSessionStatus } from '@/features/GameSession/Detail/useGameSessionStatus';
import { computed } from 'vue';
import {
  Album,
  UsersRound,
  UserRoundPlus,
  CalendarDays,
  SquarePen,
  Globe,
  Trophy,
} from '@lucide/vue';
import BaseButton from '@/components/button/BaseButton.vue';
import { useAuthStore } from '@/stores/auth';
import { useGameSessionMembership } from '@/features/GameSession/Detail/useGameSessionMembership';

const props = defineProps<{ gameSessionId: string }>();

const authStore = useAuthStore();
const {
  gameSession,
  loading: loadingDetail,
  errorMessage,
  onClickEdit,
} = useGetGameSessionDetail(props.gameSessionId);
const {
  publishSession,
  canPublish,
  loading: loadingStatus,
  completeSession,
  canComplete,
} = useGameSessionStatus(props.gameSessionId, gameSession);
const { canJoin, canLeave, join, leave, isMember, loading } =
  useGameSessionMembership(props.gameSessionId, gameSession);

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

        <!-- component を分割するか？ -->
        <div class="button-area">
          <BaseButton
            :left-icon="SquarePen"
            variant="secondary"
            @click="onClickEdit"
          >
            セッション編集
          </BaseButton>
          <BaseButton
            :left-icon="Globe"
            v-if="canPublish"
            @click="publishSession"
            :loading="loadingStatus"
          >
            公開
          </BaseButton>
          <BaseButton
            :left-icon="Trophy"
            v-if="canComplete"
            @click="completeSession"
            :loading="loadingStatus"
          >
            セッション完了！
          </BaseButton>
          <BaseButton v-if="!isMember" :left-icon="UserRoundPlus" @click="join">
            参加する
          </BaseButton>
        </div>
      </div>
    </div>

    <!-- TODO: シナリオ詳細文が実装されたら表示する -->
    <MemoDisplay :text="description"></MemoDisplay>
    <ScheduleDisplay
      :game-session-id="props.gameSessionId"
      :members="gameSession.members"
    ></ScheduleDisplay>
    <MemberDisplay :members="gameSession.members"></MemberDisplay>
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

  .button-area {
    > * {
      margin: 0 var(--space-1);
    }
  }
}
</style>
