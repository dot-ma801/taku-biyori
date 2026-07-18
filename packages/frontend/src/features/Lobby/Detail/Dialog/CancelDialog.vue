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
    title="募集を中止"
    description="中止した募集は元に戻せません。よろしいですか？"
  >
    <template #actions>
      <BaseButton variant="ghost" @click="model = false">キャンセル</BaseButton>
      <BaseButton variant="danger" @click="emit('confirm')"
        >中止する</BaseButton
      >
    </template>
  </BaseDialog>
</template>
