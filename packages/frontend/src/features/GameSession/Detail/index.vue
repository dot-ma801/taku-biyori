<script setup lang="ts">
defineOptions({ name: 'GameSessionDetail' });
import BaseSectionHeading from '@/components/common/BaseSectionHeading/BaseSectionHeading.vue';
import MemberDisplay from '@/features/GameSession/Detail/MemberDisplay.vue';
import MemoDisplay from '@/features/GameSession/Detail/MemoDisplay.vue';
import ScheduleDisplay from '@/features/GameSession/Detail/Schedule/ScheduleDisplay.vue';
import { useGetGameSessionDetail } from '@/features/GameSession/Detail/useGetGameSessionDetail';
import { useGameSessionStatus } from '@/features/GameSession/Detail/useGameSessionStatus';
import { computed, ref } from 'vue';
import {
  Album,
  UsersRound,
  UserRoundPlus,
  UserRoundMinus,
  CalendarDays,
  SquarePen,
  Globe,
  Trophy,
  Share2,
  Trash,
} from '@lucide/vue';
import BaseButton from '@/components/button/BaseButton.vue';
import { useGameSessionMembership } from '@/features/GameSession/Detail/useGameSessionMembership';
import StatusDisplay from '@/features/GameSession/Detail/StatusDisplay.vue';
import type { GameSessionMember } from '@taku-biyori/shared';
import { useGuestLink } from '@/features/GameSession/Detail/useGuestLink';
import { useGuestJoin } from '@/features/GameSession/Detail/useGuestJoin';
import { useAuthStore } from '@/stores/auth';
import GuestJoinDialog from '@/features/GameSession/Detail/Dialog/GuestJoinDialog.vue';
import DeleteDialog from '@/features/GameSession/Detail/Dialog/DeleteDialog.vue';
import { useRoute } from 'vue-router';

const props = defineProps<{ gameSessionId: string }>();

const authStore = useAuthStore();
const route = useRoute();

const guestJoinDialogModel = ref(false);
const deleteDialogModel = ref(false);

const {
  gameSession,
  loading: loadingDetail,
  errorMessage,
  patchGameSession,
  addMember,
  removeMember,
  updateMember,
  onClickEdit,
} = useGetGameSessionDetail(props.gameSessionId);

// imo: gameSession を配下のあらゆるコンポーネントで使用するから、 provide したほうがいいのでは？
// provide したコンポーネントの破棄によって、provide したデータも破棄されるから、残存リスクもないし。store使うよりいいのでは？
//
// provide('gameSession', gameSession);

const {
  isHost,
  canPublish,
  canComplete,
  canDelete,
  loading: loadingStatus,
  publishSession,
  completeSession,
  deleteSession,
} = useGameSessionStatus(props.gameSessionId, gameSession);
const {
  canJoin,
  canLeave,
  join: joinUser,
  leave,
  loading: loadingMember,
} = useGameSessionMembership(
  props.gameSessionId,
  () => gameSession.value,
  addMember,
  removeMember,
);
const {
  loading: loadingGuestLink,
  canIssueGuestLink,
  copyGuestLink,
} = useGuestLink(
  props.gameSessionId,
  () => gameSession.value?.createdBy ?? null,
  () => gameSession.value?.status,
);

// ゲスト参加可否（未ログイン時のみ意味を持つ）。トークンなし・status 非 open では表示しない。
const { canGuestJoin } = useGuestJoin(
  props.gameSessionId,
  () => route.query.token?.toString() ?? null,
  () => gameSession.value?.status,
  // ダイアログ内でも join を持つため、ここでは canGuestJoin のみ使い onJoined は空実装
  () => {},
);

/** ログインユーザーとして参加可能、またはゲストとして参加可能（招待リンク経由）か */
const canJoinAny = computed(() => canJoin.value || canGuestJoin.value);

// NOTE: UIの関心事なので、composable ではなくコンポーネント側に定義する
const scenarioName = computed(
  () => gameSession.value?.scenarioName ?? '未設定',
);
const maxMembers = computed(() => gameSession.value?.maxMembers ?? '未設定');
const description = computed(() => gameSession.value?.description ?? undefined);
const gameSessionDateTime = computed(
  () => gameSession.value?.scheduledAt ?? '未設定',
);

// ゲスト参加：メンバー追加（composable に委譲）＋ この SFC が所有する
// ダイアログの開閉という UI 状態の制御だけをここで行う。
function onGuestJoined(member: GameSessionMember) {
  addMember(member);
  guestJoinDialogModel.value = false;
}

const join = () => {
  if (authStore.currentUser) {
    joinUser();
  } else {
    guestJoinDialogModel.value = true;
  }
};
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
            v-if="canDelete"
            :left-icon="Trash"
            @click="() => (deleteDialogModel = true)"
            variant="danger"
          >
            削除
          </BaseButton>
          <BaseButton
            v-if="isHost"
            :left-icon="SquarePen"
            variant="secondary"
            @click="onClickEdit"
          >
            セッション編集
          </BaseButton>
          <!-- secondary でいいか？ -->
          <BaseButton
            v-if="canIssueGuestLink"
            :left-icon="Share2"
            variant="secondary"
            @click="copyGuestLink"
            :loading="loadingGuestLink"
          >
            招待リンクを取得
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
          <BaseButton
            v-if="canJoinAny"
            :left-icon="UserRoundPlus"
            @click="join"
            :loading="loadingMember"
          >
            参加する
          </BaseButton>
          <BaseButton
            v-if="canLeave"
            :left-icon="UserRoundMinus"
            @click="leave"
            variant="secondary"
            :loading="loadingMember"
          >
            退出する
          </BaseButton>
        </div>
      </div>
    </div>

    <!-- TODO: シナリオ詳細文が実装されたら表示する -->
    <StatusDisplay :game-session-status="gameSession.status"></StatusDisplay>
    <MemoDisplay :text="description"></MemoDisplay>
    <ScheduleDisplay
      :game-session="gameSession"
      @session-updated="patchGameSession"
    ></ScheduleDisplay>
    <MemberDisplay
      :game-session="gameSession"
      @member-updated="updateMember"
    ></MemberDisplay>

    <GuestJoinDialog
      v-model="guestJoinDialogModel"
      :game-session-id="gameSession.id"
      :game-session-status="gameSession.status"
      @guest-joined="onGuestJoined"
    ></GuestJoinDialog>
    <DeleteDialog
      v-model="deleteDialogModel"
      @on-click-delete="deleteSession"
    ></DeleteDialog>
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
