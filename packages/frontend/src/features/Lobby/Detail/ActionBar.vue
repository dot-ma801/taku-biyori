<script setup lang="ts">
import BaseButton from '@/components/button/BaseButton.vue';
import GuestJoinDialog from '@/features/Lobby/Detail/Dialog/GuestJoinDialog.vue';
import { useLobbyStatus } from '@/features/Lobby/Detail/composables/useLobbyStatus';
import { useGuestLink } from '@/features/Lobby/Detail/composables/useGuestLink';
import { useGuestJoin } from '@/features/Lobby/Detail/composables/useGuestJoin';
import { useLobbyMembership } from '@/features/Lobby/Detail/composables/useLobbyMembership';
import { useAuthStore } from '@/stores/auth';
import type { Lobby, LobbyDetail, LobbyMember } from '@taku-biyori/shared';
import { Share2, SquarePen, Ban, Globe, UserRoundPlus } from '@lucide/vue';
import { computed, ref } from 'vue';
import { useRouter, useRoute } from 'vue-router';

const props = defineProps<{ lobby: LobbyDetail }>();
const emit = defineEmits<{
  updated: [updated: Lobby];
  joined: [member: LobbyMember];
  refresh: [];
}>();

const router = useRouter();
const route = useRoute();
const authStore = useAuthStore();

const guestJoinDialogModel = ref(false);

const { canPublish, canEdit, canCancel, loading, publishLobby, cancelLobby } =
  useLobbyStatus(
    props.lobby.id,
    () => props.lobby,
    (updated) => emit('updated', updated),
  );

const { canIssueGuestLink, copyGuestLink } = useGuestLink(
  props.lobby.id,
  () => props.lobby.hostUserId,
  () => props.lobby.status,
);

const {
  canJoin,
  join: joinUser,
  loading: loadingMember,
} = useLobbyMembership(
  props.lobby.id,
  () => props.lobby,
  () => emit('refresh'),
);

const { canGuestJoin } = useGuestJoin(
  props.lobby.id,
  () => route.query.token?.toString() ?? null,
  () => props.lobby.status,
  // ダイアログ側でも join を持つため、ここでは canGuestJoin のみ使い onJoined は空実装
  () => {},
);

const canJoinAny = computed(() => canJoin.value || canGuestJoin.value);

const onClickEdit = () => {
  router.push({ name: 'lobbies-edit', params: { lobbyId: props.lobby.id } });
};

const onJoinClick = () => {
  if (authStore.currentUser) {
    joinUser();
  } else {
    guestJoinDialogModel.value = true;
  }
};

const onGuestJoined = (member: LobbyMember) => {
  guestJoinDialogModel.value = false;
  emit('joined', member);
};
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

    <BaseButton
      v-if="canJoinAny"
      :loading="loadingMember"
      :left-icon="UserRoundPlus"
      @click="onJoinClick"
    >
      参加
    </BaseButton>

    <BaseButton
      v-if="canEdit"
      variant="secondary"
      :left-icon="SquarePen"
      @click="onClickEdit"
    >
      編集
    </BaseButton>

    <BaseButton
      v-if="canIssueGuestLink"
      :left-icon="Share2"
      variant="secondary"
      @click="copyGuestLink"
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

  <GuestJoinDialog
    v-model="guestJoinDialogModel"
    :lobby-id="lobby.id"
    :lobby-status="lobby.status"
    @joined="onGuestJoined"
  />
</template>

<style scoped>
.button-area {
  > * {
    margin: 0 var(--space-1);
  }
}
</style>
