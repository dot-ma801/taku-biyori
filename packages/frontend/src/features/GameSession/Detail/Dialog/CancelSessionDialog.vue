<script setup lang="ts">
import BaseButton from '@/components/button/BaseButton.vue';
import BaseDialog from '@/components/dialog/BaseDialog.vue';

const model = defineModel<boolean>();

const emit = defineEmits<{
  cancel: [];
}>();

const onClickCancel = () => {
  emit('cancel');
};
</script>

<template>
  <BaseDialog
    v-model="model"
    title="開催を中止"
    description="この卓の開催を中止します。よろしいですか？"
  >
    <template #actions>
      <BaseButton variant="ghost" @click="model = false">戻る</BaseButton>
      <BaseButton variant="danger" @click="onClickCancel">
        中止する
      </BaseButton>
    </template>
  </BaseDialog>
</template>
