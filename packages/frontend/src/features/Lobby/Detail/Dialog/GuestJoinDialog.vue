<script setup lang="ts">
import BaseButton from '@/components/button/BaseButton.vue';
import BaseDialog from '@/components/dialog/BaseDialog.vue';
import BaseTextBox from '@/components/form/BaseTextBox/BaseTextBox.vue';
import { useGuestJoin } from '@/features/Lobby/Detail/composables/useGuestJoin';
import type { LobbyMember, LobbyStatus } from '@taku-biyori/shared';
import { useRoute } from 'vue-router';

const model = defineModel();

const props = defineProps<{
  lobbyId: string;
  lobbyStatus: LobbyStatus;
}>();

const route = useRoute();

const emit = defineEmits<{
  joined: [member: LobbyMember];
}>();

const {
  guestName,
  loading,
  join: joinGuest,
} = useGuestJoin(
  props.lobbyId,
  // getter で渡すことで route.query の変化をリアクティブに追従する
  () => route.query.token?.toString() ?? null,
  () => props.lobbyStatus,
  (member) => emit('joined', member),
);
</script>

<template>
  <BaseDialog
    v-model="model"
    title="名前を入力"
    description="ゲストユーザ名を入力してください。"
  >
    <BaseTextBox label="ゲストユーザ名" v-model="guestName"></BaseTextBox>
    <template #actions>
      <BaseButton variant="ghost" @click="model = false">キャンセル</BaseButton>
      <BaseButton variant="primary" @click="joinGuest" :loading="loading">
        参加する
      </BaseButton>
    </template>
  </BaseDialog>
</template>

<style scoped></style>
