<script setup lang="ts">
import BaseButton from '@/components/button/BaseButton.vue';
import BaseDialog from '@/components/dialog/BaseDialog.vue';
import { computed } from 'vue';

const model = defineModel<boolean>();

const props = defineProps<{
  maxPlayers: number | null | undefined;
  selectedCount: number;
}>();

const emit = defineEmits<{
  confirm: [];
}>();

const description = computed(() => {
  const max = props.maxPlayers;
  return max != null
    ? `定員 ${max} 人に対して ${props.selectedCount} 人を選出しています。このまま進みますか？`
    : 'このまま進みますか？';
});
</script>

<template>
  <BaseDialog v-model="model" title="定員の確認" :description="description">
    <template #actions>
      <BaseButton variant="ghost" @click="model = false">戻る</BaseButton>
      <BaseButton variant="primary" @click="emit('confirm')">
        このまま進む
      </BaseButton>
    </template>
  </BaseDialog>
</template>
