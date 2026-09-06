<script setup lang="ts">
import TableCard from '@/features/Table/TableCard.vue';
import type { TableCardModel } from '@/features/Table/toTableCards';

defineProps<{
  cards: TableCardModel[];
  /** 0件のときに出す一文。空状態は謝らず、次の一歩だけを示す */
  emptyMessage: string;
}>();
</script>

<template>
  <p v-if="cards.length === 0" class="table-grid__empty">
    {{ emptyMessage }}
  </p>
  <div v-else class="table-grid">
    <TableCard v-for="card in cards" :key="card.lobbyId" :card="card" />
  </div>
</template>

<style scoped>
.table-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(min(330px, 100%), 1fr));
  gap: var(--space-4);
}

.table-grid__empty {
  margin: 0;
  padding: var(--space-8) var(--space-4);
  text-align: center;
  font: var(--text-body-sm);
  color: var(--text-secondary);
  border: var(--border-width) dashed var(--border);
  border-radius: var(--radius-card);
}
</style>
