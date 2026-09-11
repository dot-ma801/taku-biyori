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
    title="企画を解散"
    description="解散すると元に戻せません。過去の開催記録は残ります。よろしいですか？"
  >
    <template #actions>
      <BaseButton variant="ghost" @click="model = false">キャンセル</BaseButton>
      <BaseButton variant="danger" @click="emit('confirm')"
        >解散する</BaseButton
      >
    </template>
  </BaseDialog>
</template>
