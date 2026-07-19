<script setup lang="ts">
defineOptions({ name: 'SessionActionBar' });
import {
  UserRoundPlus,
  UserRoundMinus,
  SquarePen,
  Globe,
  Trophy,
  Share2,
  Trash,
  XCircle,
} from '@lucide/vue';
import { computed, ref } from 'vue';
import { useRouter, useRoute } from 'vue-router';
import BaseButton from '@/components/button/BaseButton.vue';
import GuestJoinDialog from '@/features/GameSession/Detail/Dialog/GuestJoinDialog.vue';
import DeleteDialog from '@/features/GameSession/Detail/Dialog/DeleteDialog.vue';
import CancelSessionDialog from '@/features/GameSession/Detail/Dialog/CancelSessionDialog.vue';
import { useGameSessionStatus } from '@/features/GameSession/Detail/useGameSessionStatus';
import { useGameSessionMembership } from '@/features/GameSession/Detail/useGameSessionMembership';
import { useGuestLink } from '@/features/GameSession/Detail/useGuestLink';
import { useGuestJoin } from '@/features/GameSession/Detail/useGuestJoin';
import { useAuthStore } from '@/stores/auth';
import type { GameSessionDetail } from '@taku-biyori/shared';

const props = defineProps<{
  gameSessionId: string;
  gameSession: GameSessionDetail | null;
}>();

const emit = defineEmits<{
  sessionChanged: [];
}>();

const router = useRouter();
const route = useRoute();
const authStore = useAuthStore();

const deleteDialogModel = ref(false);
const guestJoinDialogModel = ref(false);
const cancelSessionDialogModel = ref(false);

const onRefresh = () => emit('sessionChanged');

const {
  isHost,
  canPublish,
  canComplete,
  canCancel,
  canDelete,
  loading: loadingStatus,
  publishSession,
  completeSession,
  cancelSession,
  deleteSession,
} = useGameSessionStatus(
  props.gameSessionId,
  () => props.gameSession,
  onRefresh,
);

const {
  canJoin,
  canLeave,
  join: joinUser,
  leave,
  loading: loadingMember,
} = useGameSessionMembership(
  props.gameSessionId,
  () => props.gameSession,
  onRefresh,
);

const {
  loading: loadingGuestLink,
  canIssueGuestLink,
  copyGuestLink,
} = useGuestLink(
  props.gameSessionId,
  () => props.gameSession?.createdBy ?? null,
  () => props.gameSession?.status,
);

const { canGuestJoin } = useGuestJoin(
  props.gameSessionId,
  () => route.query.token?.toString() ?? null,
  () => props.gameSession?.status,
  // ダイアログ内でも join を持つため、ここでは canGuestJoin のみ使い onJoined は空実装
  () => {},
);

const canJoinAny = computed(() => canJoin.value || canGuestJoin.value);

function onClickEdit() {
  router.push({
    name: 'game-sessions-edit',
    params: { gameSessionId: props.gameSessionId },
  });
}

function onJoinClick() {
  if (authStore.currentUser) {
    joinUser();
  } else {
    guestJoinDialogModel.value = true;
  }
}

function onGuestJoined() {
  guestJoinDialogModel.value = false;
  onRefresh();
}
</script>

<template>
  <div class="button-area">
    <BaseButton
      v-if="canDelete"
      :left-icon="Trash"
      variant="danger"
      @click="deleteDialogModel = true"
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
    <BaseButton
      v-if="canIssueGuestLink"
      :left-icon="Share2"
      variant="secondary"
      :loading="loadingGuestLink"
      @click="copyGuestLink"
    >
      招待リンクを取得
    </BaseButton>
    <BaseButton
      v-if="canPublish"
      :left-icon="Globe"
      :loading="loadingStatus"
      @click="publishSession"
    >
      公開
    </BaseButton>
    <BaseButton
      v-if="canComplete"
      :left-icon="Trophy"
      :loading="loadingStatus"
      @click="completeSession"
    >
      セッション完了！
    </BaseButton>
    <BaseButton
      v-if="canCancel"
      :left-icon="XCircle"
      variant="danger"
      :loading="loadingStatus"
      @click="cancelSessionDialogModel = true"
    >
      開催を中止する
    </BaseButton>
    <BaseButton
      v-if="canJoinAny"
      :left-icon="UserRoundPlus"
      :loading="loadingMember"
      @click="onJoinClick"
    >
      参加する
    </BaseButton>
    <BaseButton
      v-if="canLeave"
      :left-icon="UserRoundMinus"
      variant="secondary"
      :loading="loadingMember"
      @click="leave"
    >
      退出する
    </BaseButton>
  </div>

  <GuestJoinDialog
    v-if="gameSession"
    v-model="guestJoinDialogModel"
    :game-session-id="gameSession.id"
    :game-session-status="gameSession.status"
    @joined="onGuestJoined"
  />
  <DeleteDialog v-model="deleteDialogModel" @delete="deleteSession" />
  <CancelSessionDialog
    v-model="cancelSessionDialogModel"
    @cancel="cancelSession"
  />
</template>

<style scoped>
.button-area {
  > * {
    margin: 0 var(--space-1);
  }
}
</style>
