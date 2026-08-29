<script setup lang="ts">
import BaseButton from '@/components/button/BaseButton.vue';
import GuestJoinDialog from '@/features/Lobby/Detail/Dialog/GuestJoinDialog.vue';
import DisbandDialog from '@/features/Lobby/Detail/Dialog/DisbandDialog.vue';
import LeaveDialog from '@/features/Lobby/Detail/Dialog/LeaveDialog.vue';
import { useLobbyStatus } from '@/features/Lobby/Detail/composables/useLobbyStatus';
import { useGuestLink } from '@/features/Lobby/Detail/composables/useGuestLink';
import { useGuestJoin } from '@/features/Lobby/Detail/composables/useGuestJoin';
import { useLobbyMembership } from '@/features/Lobby/Detail/composables/useLobbyMembership';
import { useAuthStore } from '@/stores/auth';
import type {
  LobbyDetailModel,
  LobbyEntryModel,
  LobbyModel,
} from '@/models/lobby';
import {
  Share2,
  SquarePen,
  Ban,
  Globe,
  UserRoundPlus,
  UserRoundMinus,
  DoorClosed,
  Megaphone,
  RefreshCw,
} from '@lucide/vue';
import { computed, ref } from 'vue';
import { useRouter, useRoute } from 'vue-router';

const props = defineProps<{ lobby: LobbyDetailModel }>();
const emit = defineEmits<{
  updated: [updated: LobbyModel];
  'member-added': [member: LobbyEntryModel];
  'member-removed': [memberId: string];
}>();

const router = useRouter();
const route = useRoute();
const authStore = useAuthStore();

const guestJoinDialogModel = ref(false);
const disbandDialogModel = ref(false);
const leaveDialogModel = ref(false);

const {
  canPublish,
  canEdit,
  canCloseReception,
  canReopenReception,
  canDisband,
  loading,
  publishLobby,
  closeReception,
  reopenReception,
  disbandLobby,
} = useLobbyStatus(
  props.lobby.id,
  () => props.lobby,
  (updated) => emit('updated', updated),
);

const {
  canIssueGuestLink,
  copyGuestLink,
  canRegenerateGuestLink,
  regenerateGuestLink,
  uncopiedLink,
} = useGuestLink(
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

const onGuestJoined = (member: LobbyEntryModel) => {
  guestJoinDialogModel.value = false;
  emit('member-added', member);
};

const onConfirmDisband = () => {
  disbandDialogModel.value = false;
  disbandLobby();
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
      v-if="canRegenerateGuestLink"
      :left-icon="RefreshCw"
      variant="secondary"
      @click="regenerateGuestLink"
    >
      招待リンクを再発行
    </BaseButton>

    <BaseButton
      v-if="canCloseReception"
      :loading="loading"
      variant="secondary"
      :left-icon="DoorClosed"
      @click="closeReception"
    >
      受付を閉じる
    </BaseButton>

    <BaseButton
      v-if="canReopenReception"
      :loading="loading"
      :left-icon="Megaphone"
      @click="reopenReception"
    >
      追加募集
    </BaseButton>

    <BaseButton
      v-if="canDisband"
      :loading="loading"
      variant="danger"
      :left-icon="Ban"
      @click="disbandDialogModel = true"
    >
      解散
    </BaseButton>
  </div>

  <!--
    コピーできなかった招待リンク。再発行は旧トークンを即座に無効にするため、
    ここに出さないとホストが誰にもリンクを渡せなくなる
  -->
  <p v-if="uncopiedLink" class="uncopied-link">
    <span class="uncopied-link__label"
      >コピーできませんでした。以下のリンクを手動でコピーしてください。</span
    >
    <code class="uncopied-link__value">{{ uncopiedLink }}</code>
  </p>

  <GuestJoinDialog
    v-model="guestJoinDialogModel"
    :lobby-id="lobby.id"
    :lobby-status="lobby.status"
    @joined="onGuestJoined"
  />
  <DisbandDialog v-model="disbandDialogModel" @confirm="onConfirmDisband" />
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

.uncopied-link {
  display: flex;
  flex-direction: column;
  gap: var(--space-1);

  margin-top: var(--space-2);
  padding: var(--space-2);

  background: var(--color-surface-muted, var(--color-surface));
  border: 1px solid var(--color-border);
  border-radius: var(--radius-md);

  font-size: var(--font-size-sm);
}

.uncopied-link__label {
  color: var(--color-text-muted);
}

/* リンクは長いので折り返す。選択してコピーできる必要がある */
.uncopied-link__value {
  overflow-wrap: anywhere;
  user-select: all;
  font-family: var(--font-mono, monospace);
}
</style>
