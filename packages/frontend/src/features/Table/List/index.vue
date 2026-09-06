<script setup lang="ts">
defineOptions({ name: 'TableList' });
import { computed, ref } from 'vue';
import { Plus } from '@lucide/vue';
import { useRouter } from 'vue-router';
import BaseButton from '@/components/button/BaseButton.vue';
import BaseTabs from '@/components/common/BaseTabs/BaseTabs.vue';
import BaseAlert from '@/components/common/BaseAlert/BaseAlert.vue';
import TableCardGrid from '@/features/Table/TableCardGrid.vue';
import { useTableCards } from '@/features/Table/useTableCards';
import { useTableListTabs } from '@/features/Table/List/useTableListTabs';
import { TableCardStatus } from '@/features/Table/tableCardStatus';

const router = useRouter();
const { activeCards, publicCards, errorMessage } = useTableCards();

const activeTab = ref<string>(TableCardStatus.recruiting);
const { tabs, cardsOfActiveTab, emptyMessage } = useTableListTabs(
  activeCards,
  activeTab,
);

// 「さがす」導線は募集中のタブにだけ出す。他のタブでは関心が違う
const showPublicSection = computed(
  () => activeTab.value === TableCardStatus.recruiting,
);

const onClickCreate = () => {
  router.push({ name: 'lobbies-new' });
};
</script>

<template>
  <div class="table-list">
    <div class="table-list__header">
      <h1 class="table-list__title">卓</h1>
      <BaseButton :left-icon="Plus" @click="onClickCreate">
        卓をつくる
      </BaseButton>
    </div>

    <BaseAlert v-if="errorMessage" variant="error">
      {{ errorMessage }}
    </BaseAlert>

    <BaseTabs v-model="activeTab" :tabs="tabs" label="卓の状態">
      <template v-for="tab in tabs" :key="tab.value" #[tab.value]>
        <TableCardGrid
          :cards="cardsOfActiveTab"
          :empty-message="emptyMessage"
        />
      </template>
    </BaseTabs>

    <section v-if="showPublicSection" class="table-list__public">
      <h2 class="table-list__public-title">ほかの人が募集している卓</h2>
      <TableCardGrid
        :cards="publicCards"
        empty-message="いま募集している卓はありません"
      />
    </section>
  </div>
</template>

<style scoped>
.table-list {
  display: flex;
  flex-direction: column;
  gap: var(--space-6);
}

.table-list__header {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: var(--space-4);
}

.table-list__title {
  flex: 1;
  margin: 0;
  font: var(--text-h1);
  color: var(--text-primary);
}

.table-list__public {
  display: flex;
  flex-direction: column;
  gap: var(--space-3);
  padding-top: var(--space-4);
  border-top: var(--border-width) solid var(--border-subtle);
}

.table-list__public-title {
  margin: 0;
  font: var(--text-h3);
  color: var(--text-primary);
}
</style>
