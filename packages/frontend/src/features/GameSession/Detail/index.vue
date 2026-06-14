<script setup lang="ts">
defineOptions({ name: 'GameSessionDetail' });
import BaseSectionHeading from '@/components/common/BaseSectionHeading/BaseSectionHeading.vue';
import MemberDisplay from '@/features/GameSession/Detail/MemberDisplay.vue';
import MemoDisplay from '@/features/GameSession/Detail/MemoDisplay.vue';
import ScheduleDisplay from '@/features/GameSession/Detail/Schedule/ScheduleDisplay.vue';
import { useGetGameSessionDetail } from '@/features/GameSession/Detail/useGetGameSessionDetail';
import { computed } from 'vue';
import { Album, UsersRound, UserRoundPlus, SquarePen } from '@lucide/vue';
import BaseButton from '@/components/button/BaseButton.vue';
import { useAuthStore } from '@/stores/auth';

const props = defineProps<{ gameSessionId: string }>();

const authStore = useAuthStore();
const { gameSession, loading, errorMessage, onClickEdit } =
  useGetGameSessionDetail(props.gameSessionId);

// NOTE: UIの関心事なので、composable ではなくコンポーネント側に定義する
const scenarioName = computed(
  () => gameSession.value?.scenarioName ?? '未設定',
);
const maxMembers = computed(() => gameSession.value?.maxMembers ?? '未設定');
const description = computed(() => gameSession.value?.description ?? undefined);
const isMember = computed(
  () =>
    gameSession.value?.members.some(
      (item) => item.userId === authStore.currentUser?.id,
    ) ?? false,
);
</script>

<template>
  <div v-if="loading">読み込み中...</div>
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
          <UsersRound :size="16" />
          <p>募集人数: {{ maxMembers }}</p>
        </div>
        <div class="button-area">
          <BaseButton
            :left-icon="SquarePen"
            variant="secondary"
            @click="onClickEdit"
          >
            セッション編集
          </BaseButton>
          <BaseButton v-if="!isMember" :left-icon="UserRoundPlus">
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
