<script setup lang="ts">
import BaseButton from '@/components/button/BaseButton.vue';
import GuestJoinDialog from '@/features/Lobby/Detail/Dialog/GuestJoinDialog.vue';
import MemberLinkRequestDialog from '@/features/Lobby/Detail/Dialog/MemberLinkRequestDialog.vue';
import CancelDialog from '@/features/Lobby/Detail/Dialog/CancelDialog.vue';
import LeaveDialog from '@/features/Lobby/Detail/Dialog/LeaveDialog.vue';
import { useLobbyStatus } from '@/features/Lobby/Detail/composables/useLobbyStatus';
import { useGuestLink } from '@/features/Lobby/Detail/composables/useGuestLink';
import { useGuestJoin } from '@/features/Lobby/Detail/composables/useGuestJoin';
import { useLobbyMembership } from '@/features/Lobby/Detail/composables/useLobbyMembership';
import { useMemberLinkRequest } from '@/features/Lobby/Detail/composables/useMemberLinkRequest';
import { useAuthStore } from '@/stores/auth';
import type { Lobby, LobbyDetail, LobbyMember } from '@taku-biyori/shared';
import {
  Share2,
  SquarePen,
  Ban,
  Globe,
  UserRoundPlus,
  UserRoundMinus,
  Link2,
} from '@lucide/vue';
import { computed, ref } from 'vue';
import { useRouter, useRoute } from 'vue-router';

const props = defineProps<{ lobby: LobbyDetail }>();
const emit = defineEmits<{
  updated: [updated: Lobby];
  'member-added': [member: LobbyMember];
  'member-removed': [memberId: string];
}>();

const router = useRouter();
const route = useRoute();
const authStore = useAuthStore();

const guestJoinDialogModel = ref(false);
const cancelDialogModel = ref(false);
const leaveDialogModel = ref(false);
const memberLinkDialogModel = ref(false);

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
  canLeave,
  join: joinUser,
  leave,
  loading: loadingMember,
} = useLobbyMembership(
  props.lobby.id,
  () => props.lobby,
  (member) => emit('member-added', member),
  (memberId) => emit('member-removed', memberId),
);

const { canGuestJoin } = useGuestJoin(
  props.lobby.id,
  () => route.query.token?.toString() ?? null,
  () => props.lobby.status,
  // ダイアログ側でも join を持つため、ここでは canGuestJoin のみ使い onJoined は空実装
  () => {},
);

// ゲスト参加をアカウントへ紐づける導線（ADR 0008）。
// ゲストリンクは認証の往復で失われるため、トークンの有無では判定しない。
const { canRequestLink } = useMemberLinkRequest(
  props.lobby.id,
  () => props.lobby.members,
  () => props.lobby.hostUserId,
  // ダイアログ側でも申請を持つため、ここでは canRequestLink のみ使う
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

const onMemberLinkRequested = () => {
  memberLinkDialogModel.value = false;
};

const onGuestJoined = (member: LobbyMember) => {
  guestJoinDialogModel.value = false;
  emit('member-added', member);
};

const onConfirmCancel = () => {
  cancelDialogModel.value = false;
  cancelLobby();
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
      v-if="canLeave"
      :loading="loadingMember"
      variant="secondary"
      :left-icon="UserRoundMinus"
      @click="leaveDialogModel = true"
    >
      退出
    </BaseButton>

    <BaseButton
      v-if="canRequestLink"
      variant="secondary"
      :left-icon="Link2"
      @click="memberLinkDialogModel = true"
    >
      ゲスト参加を紐づける
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
      @click="cancelDialogModel = true"
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
  <MemberLinkRequestDialog
    v-model="memberLinkDialogModel"
    :lobby="lobby"
    @requested="onMemberLinkRequested"
  />
  <CancelDialog v-model="cancelDialogModel" @confirm="onConfirmCancel" />
  <LeaveDialog v-model="leaveDialogModel" @confirm="leave" />
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
