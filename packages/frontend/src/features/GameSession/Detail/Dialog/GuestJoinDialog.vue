<script setup lang="ts">
import BaseButton from '@/components/button/BaseButton.vue';
import BaseDialog from '@/components/dialog/BaseDialog.vue';
import BaseTextBox from '@/components/form/BaseTextBox/BaseTextBox.vue';
import { useGuestJoin } from '@/features/GameSession/Detail/useGuestJoin';
import type { GameSessionMember, GameSessionStatus } from '@taku-biyori/shared';
import { useRoute } from 'vue-router';

const model = defineModel();

const props = defineProps<{
  gameSessionId: string;
  gameSessionStatus: GameSessionStatus;
}>();

const route = useRoute();
const token = route.query.token?.toString() ?? '';

const emit = defineEmits<{
  guestJoined: [member: GameSessionMember];
}>();

const {
  guestName,
  loading,
  join: joinGuest,
} = useGuestJoin(
  props.gameSessionId,
  () => token,
  () => props.gameSessionStatus,
  // 参加成功後の新メンバーを親へ渡す（書き込みは親に委譲）
  (member: GameSessionMember) => emit('guestJoined', member),
);
</script>

<template>
  <BaseDialog
    v-model="model"
    title="名前を入力"
    description="ゲストユーザ名を入力してください。キャラクター名は別途登録されます。"
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
