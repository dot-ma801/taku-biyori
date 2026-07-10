<script setup lang="ts">
import SessionCard from '@/components/common/SessionCard/SessionCard.vue';
import EmptyState from '@/components/common/EmptyState/EmptyState.vue';
import { GameSessionStatus } from '@taku-biyori/shared';
import type { GameSessionListItem } from '@taku-biyori/shared';
import { Search } from '@lucide/vue';
import { computed } from 'vue';
import { useRouter } from 'vue-router';

type CardStatus = 'recruiting' | 'full' | 'confirmed' | 'ended';

const props = defineProps<{
  publicSessions: GameSessionListItem[];
}>();

const router = useRouter();

function toCardStatus(item: GameSessionListItem): CardStatus {
  if (item.status === GameSessionStatus.completed) {
    return 'ended';
  }
  if (
    item.maxMembers != null &&
    item.memberCount >= item.maxMembers &&
    (item.status === GameSessionStatus.open ||
      item.status === GameSessionStatus.scheduling)
  ) {
    return 'full';
  }
  if (
    item.status === GameSessionStatus.confirmed ||
    item.status === GameSessionStatus.today
  ) {
    return 'confirmed';
  }
  return 'recruiting';
}

function toSlotsLabel(item: GameSessionListItem, card: CardStatus): string {
  if (card === 'full') {
    return '満席';
  }
  if (card === 'confirmed') {
    return '開催確定';
  }
  if (card === 'ended') {
    return '終了';
  }
  if (item.maxMembers != null) {
    const remaining = item.maxMembers - item.memberCount;
    return remaining > 0 ? `あと${remaining}枠` : '満席';
  }
  return '';
}

const cards = computed(() =>
  [...props.publicSessions].map((item) => {
    const cardStatus = toCardStatus(item);
    return {
      id: item.id,
      title: item.title,
      dateLabel: item.scheduledAt ?? '日程調整中',
      location: 'オンライン',
      status: cardStatus,
      slotsLabel: toSlotsLabel(item, cardStatus),
      tag: item.scenarioName ?? undefined,
    };
  }),
);

const hasSessions = computed(() => cards.value.length > 0);

const onOpen = (id: string) => {
  router.push({
    name: 'game-sessions-detail',
    params: { gameSessionId: id },
  });
};
</script>

<template>
  <section class="section">
    <header class="section__header">
      <p class="section__eyebrow">みんなの卓</p>
      <h2 class="section__title">募集中のセッション</h2>
      <p class="section__subtitle">気になる卓を見つけて参加してみましょう。</p>
    </header>

    <div v-if="hasSessions" class="cards">
      <SessionCard
        v-for="card in cards"
        :key="card.id"
        :title="card.title"
        :date-label="card.dateLabel"
        :location="card.location"
        :status="card.status"
        :slots-label="card.slotsLabel"
        :tag="card.tag"
        @click="onOpen(card.id)"
      />
    </div>

    <EmptyState
      v-else
      :icon="Search"
      title="まだ卓が立っていません"
      description="最初のセッションを募集してみましょう。"
    />
  </section>
</template>

<style scoped>
.section__header {
  margin-bottom: var(--space-5);
}

.section__eyebrow {
  margin: 0 0 var(--space-1);
  font: var(--type-label);
  color: var(--brand-primary);
  letter-spacing: var(--tracking-wide);
}

.section__title {
  margin: 0;
  font: var(--weight-bold) var(--text-2xl) / var(--leading-tight)
    var(--font-display);
  color: var(--text-primary);
}

.section__subtitle {
  margin: var(--space-1) 0 0;
  color: var(--text-secondary);
  font-size: var(--text-sm);
}

.cards {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
  gap: var(--space-4);
}
</style>
