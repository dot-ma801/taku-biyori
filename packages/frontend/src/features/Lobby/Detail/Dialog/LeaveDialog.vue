<script setup lang="ts">
import BaseButton from '@/components/button/BaseButton.vue';
import BaseDialog from '@/components/dialog/BaseDialog.vue';

const model = defineModel<boolean>();

const emit = defineEmits<{
  confirm: [];
}>();
</script>

<template>
  <BaseDialog
    v-model="model"
    title="退出の確認"
    description="ロビーから退出します。よろしいですか？"
  >
    <template #actions>
      <BaseButton variant="ghost" @click="model = false">キャンセル</BaseButton>
      <BaseButton variant="danger" @click="emit('confirm')"
        >退出する</BaseButton
      >
    </template>
  </BaseDialog>
</template>
