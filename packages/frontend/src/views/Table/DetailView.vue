<script setup lang="ts">
import TableDetail from '@/features/Table/Detail/index.vue';
import PageContainer from '@/components/layout/PageContainer/PageContainer.vue';

defineProps<{
  lobbyId: string;
  /** 開催の URL から来たときに開くタブ */
  initialTab?: string;
}>();
</script>

<template>
  <PageContainer size="lg">
    <TableDetail :lobby-id="lobbyId" :initial-tab="initialTab" />
  </PageContainer>
</template>
