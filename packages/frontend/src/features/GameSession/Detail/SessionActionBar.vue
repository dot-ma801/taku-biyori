<script setup lang="ts">
defineOptions({ name: 'SessionActionBar' });
import {
  UserRoundPlus,
  UserRoundMinus,
  SquarePen,
  Globe,
  Trophy,
  Trash,
  XCircle,
} from '@lucide/vue';
import { ref } from 'vue';
import { useRouter } from 'vue-router';
import BaseButton from '@/components/button/BaseButton.vue';
import DeleteDialog from '@/features/GameSession/Detail/Dialog/DeleteDialog.vue';
import CancelSessionDialog from '@/features/GameSession/Detail/Dialog/CancelSessionDialog.vue';
import { useGameSessionStatus } from '@/features/GameSession/Detail/useGameSessionStatus';
import { useGameSessionMembership } from '@/features/GameSession/Detail/useGameSessionMembership';
import type { LegacyGameSessionDetail } from '@taku-biyori/shared';

const props = defineProps<{
  gameSessionId: string;
  gameSession: LegacyGameSessionDetail | null;
}>();

const emit = defineEmits<{
  sessionChanged: [];
}>();

const router = useRouter();

const deleteDialogModel = ref(false);
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

function onClickEdit() {
  router.push({
    name: 'game-sessions-edit',
    params: { gameSessionId: props.gameSessionId },
  });
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
      v-if="canJoin"
      :left-icon="UserRoundPlus"
      :loading="loadingMember"
      @click="joinUser"
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
  <DeleteDialog v-model="deleteDialogModel" @delete="deleteSession" />
  <CancelSessionDialog
    v-model="cancelSessionDialogModel"
    @cancel="cancelSession"
  />
</template>

<style scoped>
/*
 * ボタンは画面幅によって折り返る。margin で横方向だけ空けると
 * 折り返した行同士が密着するため、flex + gap で縦横まとめて空ける。
 */
.button-area {
  display: flex;
  flex-wrap: wrap;
  gap: var(--space-2);
}
</style>
