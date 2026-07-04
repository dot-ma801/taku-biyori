<script setup lang="ts">
import BaseButton from '@/components/button/BaseButton.vue';
import BaseDialog from '@/components/dialog/BaseDialog.vue';
import BaseTextBox from '@/components/form/BaseTextBox/BaseTextBox.vue';
import { useGuestJoin } from '@/features/GameSession/Detail/useGuestJoin';
import type { GameSessionStatus } from '@taku-biyori/shared';
import { useRoute } from 'vue-router';

const model = defineModel();

const props = defineProps<{
  gameSessionId: string;
  gameSessionStatus: GameSessionStatus;
}>();

const route = useRoute();

const emit = defineEmits<{
  joined: [];
}>();

const {
  guestName,
  loading,
  join: joinGuest,
} = useGuestJoin(
  props.gameSessionId,
  // getter で渡すことで route.query の変化をリアクティブに追従する
  () => route.query.token?.toString() ?? null,
  () => props.gameSessionStatus,
  () => emit('joined'),
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
