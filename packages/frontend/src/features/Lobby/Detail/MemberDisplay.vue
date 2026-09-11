<script setup lang="ts">
import UserAvatar from '@/features/user/UserAvatar/UserAvatar.vue';
import BaseButton from '@/components/button/BaseButton.vue';
import BaseCard from '@/components/common/BaseCard/BaseCard.vue';
import BaseSectionHeading from '@/components/common/BaseSectionHeading/BaseSectionHeading.vue';
import RemoveMemberDialog from '@/features/Lobby/Detail/Dialog/RemoveMemberDialog.vue';
import { useLobbyMembership } from '@/features/Lobby/Detail/composables/useLobbyMembership';
import { useEntryListView } from '@/features/Lobby/Detail/composables/useEntryListView';
import { UsersRound, UserRoundX } from '@lucide/vue';
import type { LobbyDetailModel } from '@/models/lobby';
import { computed, ref } from 'vue';

const props = defineProps<{
  lobby: LobbyDetailModel;
}>();

const emit = defineEmits<{
  'member-removed': [memberId: string];
}>();

const { canRemoveMember, removeMember, loading } = useLobbyMembership(
  props.lobby.id,
  () => props.lobby,
  // メンバー追加はこのコンポーネントの関心外
  () => {},
  (memberId) => emit('member-removed', memberId),
);

// 参加者一覧は脱退者も含めて全件出す（グレー表示にする）
const { displayEntries, displayNameOf } = useEntryListView(
  () => props.lobby.entries,
);

/** 取り消し確認ダイアログの対象メンバー ID（null のときダイアログ非表示） */
const pendingRemoveMemberId = ref<string | null>(null);

const removeDialogOpen = computed({
  get: () => pendingRemoveMemberId.value !== null,
  set: (v) => {
    if (!v) pendingRemoveMemberId.value = null;
  },
});

const pendingMemberName = computed(() =>
  displayNameOf(pendingRemoveMemberId.value),
);

const onConfirmRemove = () => {
  if (pendingRemoveMemberId.value) {
    removeMember(pendingRemoveMemberId.value);
  }
  pendingRemoveMemberId.value = null;
};
</script>

<template>
  <BaseCard>
    <BaseSectionHeading class="header" level="h3" :icon="UsersRound">
      参加者
    </BaseSectionHeading>

    <div
      v-for="entry in displayEntries"
      :key="entry.id"
      class="user-container"
      :class="{ 'user-container--left': entry.hasLeft }"
    >
      <UserAvatar
        class="avatar"
        :size="35"
        :user-id="entry.userId"
        :name="entry.baseName"
      />

      <p>
        {{ entry.userName }}
        <span v-if="entry.hasLeft" class="left-badge">脱退</span>
      </p>

      <BaseButton
        v-if="canRemoveMember && !entry.hasLeft"
        variant="secondary"
        :left-icon="UserRoundX"
        :loading="loading"
        @click="pendingRemoveMemberId = entry.id"
      >
        取り消し
      </BaseButton>
    </div>
  </BaseCard>

  <RemoveMemberDialog
    v-model="removeDialogOpen"
    :member-name="pendingMemberName"
    @confirm="onConfirmRemove"
  />
</template>

<style scoped>
.header {
  margin-bottom: var(--space-4);
}

.user-container {
  display: grid;
  grid-template-columns: auto 1fr auto;
  align-items: center;

  gap: var(--space-2);
  padding: var(--space-2);

  border-top: solid 2px var(--color-border);
}

/* 脱退した参加者は記録として残すが、在籍中と見分けがつくよう落とす */
.user-container--left {
  opacity: 0.5;
}

.left-badge {
  margin-left: var(--space-1);
  padding: 1px 6px;
  font-size: 11px;
  color: var(--color-text-secondary);
  background: var(--color-surface-muted);
  border-radius: var(--radius-full);
}
</style>
