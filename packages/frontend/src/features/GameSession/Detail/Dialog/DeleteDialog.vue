<script setup lang="ts">
import BaseButton from '@/components/button/BaseButton.vue';
import BaseDialog from '@/components/dialog/BaseDialog.vue';

const model = defineModel();

const emit = defineEmits<{
  onClickDelete: [];
}>();

const onClickDelete = () => {
  emit('onClickDelete')
}
</script>

<template>
  <BaseDialog
    v-model="model"
    title="セッションを削除"
    description="一度削除したセッションは復元できません。よろしいですか？"
  >
    <template #actions>
      <BaseButton variant="ghost" @click="model = false">キャンセル</BaseButton>
      <BaseButton variant="danger" @click="onClickDelete">
        削除する
      </BaseButton>
    </template>
  </BaseDialog>
</template>

<style scoped></style>
