<script setup lang="ts">
import BaseButton from '@/components/button/BaseButton.vue';
import BaseDialog from '@/components/dialog/BaseDialog.vue';
import BaseRadioGroup from '@/components/form/BaseRadioGroup/BaseRadioGroup.vue';
import { useMemberLinkRequest } from '@/features/Lobby/Detail/composables/useMemberLinkRequest';
import { memberDisplayName } from '@/utils/memberDisplayName';
import type { LobbyDetail } from '@taku-biyori/shared';
import { computed } from 'vue';

const model = defineModel();

const props = defineProps<{
  lobby: LobbyDetail;
}>();

const emit = defineEmits<{
  requested: [];
}>();

const { selectedMemberId, guestMembers, loading, submit } =
  useMemberLinkRequest(
    props.lobby.id,
    () => props.lobby.members,
    () => props.lobby.hostUserId,
    () => emit('requested'),
  );

const guestOptions = computed(() =>
  guestMembers.value.map((member) => ({
    value: member.id,
    label: memberDisplayName(member),
  })),
);
</script>

<template>
  <BaseDialog
    v-model="model"
    title="ゲスト参加をアカウントに紐づける"
    description="あなたがゲストとして参加したときの名前を選んでください。主催者が承認すると、日程の回答や記録があなたのアカウントに引き継がれます。"
  >
    <BaseRadioGroup
      v-model="selectedMemberId"
      label="ゲスト参加時の名前"
      :options="guestOptions"
    />
    <template #actions>
      <BaseButton variant="ghost" @click="model = false">キャンセル</BaseButton>
      <BaseButton variant="primary" :loading="loading" @click="submit">
        申請する
      </BaseButton>
    </template>
  </BaseDialog>
</template>

<style scoped></style>
