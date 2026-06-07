<script setup lang="ts">
import BaseCard from '@/components/common/BaseCard/BaseCard.vue';
import BaseSectionHeading from '@/components/common/BaseSectionHeading/BaseSectionHeading.vue';
import { Info } from '@lucide/vue';

const props = defineProps<{
  text?: string;
}>();
</script>

<template>
  <BaseCard>
    <BaseSectionHeading level="h3" :icon="Info">
      シナリオ概要
    </BaseSectionHeading>

    <p>{{ props.text }}</p>
  </BaseCard>
</template>

<style scoped></style>
