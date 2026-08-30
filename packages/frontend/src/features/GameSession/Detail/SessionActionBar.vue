<script setup lang="ts">
defineOptions({ name: 'SessionActionBar' });
import { SquarePen, Trophy, Trash, XCircle } from '@lucide/vue';
import { ref } from 'vue';
import { useRouter } from 'vue-router';
import BaseButton from '@/components/button/BaseButton.vue';
import DeleteDialog from '@/features/GameSession/Detail/Dialog/DeleteDialog.vue';
import CancelSessionDialog from '@/features/GameSession/Detail/Dialog/CancelSessionDialog.vue';
import { useGameSessionStatus } from '@/features/GameSession/Detail/useGameSessionStatus';
import type { GameSessionDetailModel } from '@/models/game-session';

const props = defineProps<{
  lobbyId: string;
  gameSessionId: string;
  gameSession: GameSessionDetailModel | null;
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
  canComplete,
  canCancel,
  canDelete,
  loading: loadingStatus,
  completeGameSession,
  cancelGameSession,
  removeGameSession,
} = useGameSessionStatus(
  props.lobbyId,
  props.gameSessionId,
  () => props.gameSession,
  onRefresh,
);

function onClickEdit() {
  router.push({
    name: 'game-sessions-edit',
    params: { lobbyId: props.lobbyId, gameSessionId: props.gameSessionId },
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
      開催を編集
    </BaseButton>
    <BaseButton
      v-if="canComplete"
      :left-icon="Trophy"
      :loading="loadingStatus"
      @click="completeGameSession"
    >
      開催を完了する
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
  </div>
  <DeleteDialog v-model="deleteDialogModel" @delete="removeGameSession" />
  <CancelSessionDialog
    v-model="cancelSessionDialogModel"
    @cancel="cancelGameSession"
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
