<script setup lang="ts">
import BaseButton from '@/components/button/BaseButton.vue';
import { useLobbyStatus } from '@/features/Lobby/Detail/composables/useLobbyStatus';
import { useGuestLink } from '@/features/Lobby/Detail/composables/useGuestLink';
import type { Lobby, LobbyDetail } from '@taku-biyori/shared';
import { Share2, SquarePen, Ban, Globe } from '@lucide/vue';
import { useRouter } from 'vue-router';

const props = defineProps<{ lobby: LobbyDetail }>();
const emit = defineEmits<{ updated: [updated: Lobby] }>();

const router = useRouter();
const { canPublish, canEdit, canCancel, loading, publishLobby, cancelLobby } =
  useLobbyStatus(
    props.lobby.id,
    () => props.lobby,
    (updated) => emit('updated', updated),
  );

const { canIssueGuestLink } = useGuestLink(
  props.lobby.id,
  () => props.lobby.hostUserId,
  () => props.lobby.status,
);

const onClickEdit = () => {
    router.push({ name: 'lobbies-edit', params: { globbyIdameSessionId: props.lobby.id } });
}
</script>

<template>
  <div class="button-area">
    <BaseButton
      v-if="canPublish"
      :loading="loading"
      :left-icon="Globe"
      @click="publishLobby"
    >
      公開
    </BaseButton>

    <BaseButton v-if="canEdit" variant="secondary" :left-icon="SquarePen" @click="onClickEdit">
      編集
    </BaseButton>

    <BaseButton
      v-if="canIssueGuestLink"
      :left-icon="Share2"
      variant="secondary"
    >
      招待リンクを取得
    </BaseButton>

    <BaseButton
      v-if="canCancel"
      :loading="loading"
      variant="danger"
      :left-icon="Ban"
      @click="cancelLobby"
    >
      募集中止
    </BaseButton>
  </div>
</template>

<style scoped>
.button-area {
  > * {
    margin: 0 var(--space-1);
  }
}
</style>
