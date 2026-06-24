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
  onGuestJoined : [member: GameSessionMember];
}>();

const {
  guestName,
  loading,
  join: joinGuest,
} = useGuestJoin(
  props.gameSessionId,
  () => token,
  () => props.gameSessionStatus,
  // TODO: ゲスト参加フォームを配線したら、参加した member を反映する処理に差し替える
  (member: GameSessionMember) => emit('onGuestJoined', member),
);
</script>

<template>
  <BaseDialog v-model="model" title="名前を入力" description="ゲストユーザ名を入力してください。キャラクター名は別途登録されます。">
    <BaseTextBox label="ゲストユーザ名" v-model="guestName"></BaseTextBox>
    <template #actions>
      <BaseButton variant="ghost">キャンセル</BaseButton>
      <BaseButton variant="primary" @click="joinGuest" :loading="loading">
        参加する
      </BaseButton>
    </template>
  </BaseDialog>
</template>

<style scoped></style>
