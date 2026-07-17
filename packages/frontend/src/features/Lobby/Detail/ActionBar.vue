<script setup lang="ts">
import BaseButton from '@/components/button/BaseButton.vue';
import { useLobbyStatus } from '@/features/Lobby/Detail/composables/useLobbyStatus';
import type { Lobby, LobbyDetail } from '@taku-biyori/shared';
import { Share2, SquarePen, Ban, Globe } from '@lucide/vue';

const props = defineProps<{ lobby: LobbyDetail }>();
const emit = defineEmits<{ updated: [updated: Lobby] }>();

const {
  canPublish,
  canCancel,
  loading,
  publishLobby,
  cancelLobby
} = useLobbyStatus(
  props.lobby.id,
  () => props.lobby,
  (updated) => emit('updated', updated)
)
</script>

<template>
  <div class="button-area">
    <BaseButton v-if="canPublish" :loading="loading" :left-icon="Globe" @click="publishLobby">
      公開
    </BaseButton>

    <BaseButton variant="secondary" :left-icon="SquarePen"> 編集 </BaseButton>

    <BaseButton :left-icon="Share2" variant="secondary">
      招待リンクを取得
    </BaseButton>

    <BaseButton v-if="canCancel" :loading="loading" variant="danger" :left-icon="Ban" @click="cancelLobby">
      募集中止
    </BaseButton>
  </div>
</template>

<style scoped>
.button-area {
  >* {
    margin: 0 var(--space-1);
  }
}
</style>
