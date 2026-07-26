<script setup lang="ts">
import UserAvatar from '@/features/user/UserAvatar/UserAvatar.vue';
import BaseButton from '@/components/button/BaseButton.vue';
import BaseCard from '@/components/common/BaseCard/BaseCard.vue';
import BaseSectionHeading from '@/components/common/BaseSectionHeading/BaseSectionHeading.vue';
import RemoveMemberDialog from '@/features/Lobby/Detail/Dialog/RemoveMemberDialog.vue';
import { useLobbyMembership } from '@/features/Lobby/Detail/composables/useLobbyMembership';
import { UsersRound, UserRoundX } from '@lucide/vue';
import type { LobbyDetail } from '@taku-biyori/shared';
import { memberDisplayName, memberBaseName } from '@/utils/memberDisplayName';
import { computed, ref } from 'vue';

const props = defineProps<{
  lobby: LobbyDetail;
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

const displayMembers = computed(() => {
  return props.lobby.members.map((member) => ({
    id: member.id,
    userName: memberDisplayName(member),
    // アバターの種。id を持つメンバーは userId を優先し、
    // 他画面（ヘッダー・プロフィール）と絵柄を揃える
    userId: member.userId,
    // id を持たないゲスト向けのフォールバック。
    // サフィックスの有無で絵柄が変わらないよう baseName を渡す
    baseName: memberBaseName(member),
  }));
});

/** 取り消し確認ダイアログの対象メンバー ID（null のときダイアログ非表示） */
const pendingRemoveMemberId = ref<string | null>(null);

const removeDialogOpen = computed({
  get: () => pendingRemoveMemberId.value !== null,
  set: (v) => {
    if (!v) pendingRemoveMemberId.value = null;
  },
});

const pendingMemberName = computed(() => {
  const found = displayMembers.value.find(
    (m) => m.id === pendingRemoveMemberId.value,
  );
  return found?.userName ?? '';
});

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
      参加メンバー
    </BaseSectionHeading>

    <div
      v-for="member in displayMembers"
      :key="member.id"
      class="user-container"
    >
      <UserAvatar
        class="avatar"
        :size="35"
        :user-id="member.userId"
        :name="member.baseName"
      />

      <p>{{ member.userName }}</p>

      <BaseButton
        v-if="canRemoveMember"
        variant="secondary"
        :left-icon="UserRoundX"
        :loading="loading"
        @click="pendingRemoveMemberId = member.id"
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
</style>
