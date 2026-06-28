<script setup lang="ts">
import BaseButton from '@/components/button/BaseButton.vue';
import BaseCard from '@/components/common/BaseCard/BaseCard.vue';
import BaseSectionHeading from '@/components/common/BaseSectionHeading/BaseSectionHeading.vue';
import GameSessionStatusBadge from '@/components/common/GameSessionStatusBadge/GameSessionStatusBadge.vue';
import { useHomeData } from '@/features/Home/useHomeData';
import { GameSessionStatus } from '@taku-biyori/shared';
import { Bookmark, Calendar, UsersRound } from '@lucide/vue';
import { computed } from 'vue';
import { useRouter } from 'vue-router';

const router = useRouter();
const { mySessions } = useHomeData();

const STATUS_ORDER: Record<GameSessionStatus, number> = {
  [GameSessionStatus.today]: 0,
  [GameSessionStatus.confirmed]: 1,
  [GameSessionStatus.scheduling]: 2,
  [GameSessionStatus.open]: 3,
  [GameSessionStatus.draft]: 4,
  [GameSessionStatus.completed]: 5,
};

// FIXME: これは、バックエンド側でやるべきでは？ > issue を起票したらその番号を付記すること
const formattedMySessions = computed(() =>
  [...mySessions.value].sort(
    (a, b) => STATUS_ORDER[a.status] - STATUS_ORDER[b.status],
  ),
);

const formattedDate = computed(() =>
  formattedMySessions.value.map((item) => item.scheduledAt ?? '調整中'),
);

const formattedMaxMembers = computed(() =>
  formattedMySessions.value.map((item) => item.maxMembers ?? '-'),
);

const onClickOpen = (id: string) => {
  router.push({
    name: 'game-sessions-detail',
    params: {
      gameSessionId: id,
    },
  });
};
</script>

<template>
  <BaseCard>
    <BaseSectionHeading class="card-header" level="h3" :icon="Bookmark">
      あなたのセッション
    </BaseSectionHeading>

    <div v-for="(item, idx) in formattedMySessions" class="item">
      <div>
        <BaseSectionHeading level="h4">{{ item.title }}</BaseSectionHeading>
        <div class="session-meta">
          <span class="meta-group">
            <Calendar :size="16" />
            <p>{{ formattedDate[idx] }}</p>
          </span>
          <span class="meta-group">
            <UsersRound :size="16" />
            <p>{{ item.memberCount }}/{{ formattedMaxMembers[idx] }}</p>
          </span>
        </div>
      </div>
      <div class="right-area">
        <GameSessionStatusBadge :status="item.status" />
        <BaseButton variant="secondary" @click="onClickOpen(item.id)">
          開く
        </BaseButton>
      </div>
    </div>
  </BaseCard>
</template>

<style scoped>
.card-header {
  padding-bottom: var(--space-3);
  border-bottom: 1px solid var(--color-border);
}

.item {
  display: flex;
  align-items: center;
  justify-content: space-between;

  padding: var(--space-2);

  border-bottom: 1px solid var(--color-border);

  .right-area {
    display: flex;
    align-items: center;
    gap: var(--space-2);
  }
}

.item:last-child {
  border-bottom: none;
}

.session-meta {
  display: flex;
  align-items: center;
  gap: var(--space-2);

  color: var(--color-text-muted);
  font-size: var(--font-size-sm);

  .meta-group {
    display: flex;
    align-items: center;
    gap: var(--space-1);
  }
}
</style>
