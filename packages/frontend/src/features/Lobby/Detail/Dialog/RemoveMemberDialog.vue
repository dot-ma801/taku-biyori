<script setup lang="ts">
import BaseButton from '@/components/button/BaseButton.vue';
import BaseDialog from '@/components/dialog/BaseDialog.vue';
import { computed } from 'vue';

const model = defineModel<boolean>();

const props = defineProps<{
  memberName: string;
}>();

const emit = defineEmits<{
  confirm: [];
}>();

const description = computed(
  () => `${props.memberName} を参加者から取り消します。よろしいですか？`,
);
</script>

<template>
  <BaseDialog v-model="model" title="取り消しの確認" :description="description">
    <template #actions>
      <BaseButton variant="ghost" @click="model = false">キャンセル</BaseButton>
      <BaseButton variant="danger" @click="emit('confirm')"
        >取り消す</BaseButton
      >
    </template>
  </BaseDialog>
</template>
