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
    title="ログアウトの確認"
    description="ログアウトしますか？"
  >
    <template #actions>
      <BaseButton variant="ghost" @click="model = false">キャンセル</BaseButton>
      <BaseButton variant="danger" @click="emit('confirm')">
        ログアウト
      </BaseButton>
    </template>
  </BaseDialog>
</template>
