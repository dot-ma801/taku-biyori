<script setup lang="ts">
import BaseButton from '@/components/button/BaseButton.vue';
import BaseDialog from '@/components/dialog/BaseDialog.vue';
import BaseTextBox from '@/components/form/BaseTextBox/BaseTextBox.vue';

const model = defineModel();
</script>

<template>
  <BaseDialog
    v-model="model"
    title="名前を入力"
    description="ゲストユーザ名を入力してください。キャラクター名は別途登録されます。"
  >
    <BaseTextBox label="ゲストユーザ名"></BaseTextBox>
    <template #actions>
      <BaseButton variant="ghost" >キャンセル</BaseButton>
      <BaseButton variant="primary"  @click="">
        参加する
      </BaseButton>
    </template>
  </BaseDialog>
</template>

<style scoped></style>
