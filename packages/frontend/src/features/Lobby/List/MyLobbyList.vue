<script setup lang="ts">
import BaseButton from '@/components/button/BaseButton.vue';
import BaseCard from '@/components/common/BaseCard/BaseCard.vue';
import BaseSectionHeading from '@/components/common/BaseSectionHeading/BaseSectionHeading.vue';
import LobbyStatusBadge from '@/components/common/LobbyStatusBadge/LobbyStatusBadge.vue';
import { LobbyStatus } from '@taku-biyori/shared';
import type { LobbyListItem } from '@taku-biyori/shared';
import { Bookmark, ChevronDown, ChevronUp, UsersRound } from '@lucide/vue';
import { computed, ref } from 'vue';
import { useRouter } from 'vue-router';

const props = defineProps<{
  myLobbies: LobbyListItem[];
}>();

const router = useRouter();

const STATUS_ORDER: Record<LobbyStatus, number> = {
  [LobbyStatus.open]: 0,
  [LobbyStatus.scheduling]: 1,
  [LobbyStatus.confirmed]: 2,
  [LobbyStatus.draft]: 3,
  [LobbyStatus.cancelled]: 4,
};

const INITIAL_VISIBLE_COUNT = 3;
const isExpanded = ref(false);

const formattedMyLobbies = computed(() =>
  [...props.myLobbies]
    .sort((a, b) => STATUS_ORDER[a.status] - STATUS_ORDER[b.status])
    .map((item) => ({
      ...item,
      formattedMaxPlayers: item.maxPlayers ?? '-',
    })),
);

const visibleLobbies = computed(() =>
  isExpanded.value
    ? formattedMyLobbies.value
    : formattedMyLobbies.value.slice(0, INITIAL_VISIBLE_COUNT),
);

const hiddenCount = computed(
  () => formattedMyLobbies.value.length - INITIAL_VISIBLE_COUNT,
);

const hasMore = computed(() => hiddenCount.value > 0);
const isEmpty = computed(() => formattedMyLobbies.value.length === 0);

const onClickOpen = (id: string) => {
  router.push({
    name: 'lobbies-detail',
    params: { lobbyId: id },
  });
};
</script>

<template>
  <BaseCard>
    <BaseSectionHeading class="card-header" level="h3" :icon="Bookmark">
      あなたのロビー
    </BaseSectionHeading>

    <p v-if="isEmpty" class="empty-message">
      まだ参加しているロビーはありません
    </p>

    <div v-for="item in visibleLobbies" :key="item.id" class="item">
      <div>
        <BaseSectionHeading level="h4">{{ item.title }}</BaseSectionHeading>
        <div class="lobby-meta">
          <span class="meta-group">
            <UsersRound :size="16" />
            <p>{{ item.memberCount }}/{{ item.formattedMaxPlayers }}</p>
          </span>
        </div>
      </div>
      <div class="right-area">
        <LobbyStatusBadge :status="item.status" />
        <BaseButton variant="secondary" @click="onClickOpen(item.id)">
          開く
        </BaseButton>
      </div>
    </div>

    <button
      v-if="hasMore && !isExpanded"
      class="expand-button"
      @click="isExpanded = true"
    >
      <ChevronDown :size="16" />
      更に見る（{{ hiddenCount }}件）
    </button>
    <button
      v-else-if="hasMore && isExpanded"
      class="expand-button"
      @click="isExpanded = false"
    >
      <ChevronUp :size="16" />
      閉じる
    </button>
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

.expand-button {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: var(--space-1);

  width: 100%;
  padding: var(--space-2);

  background: none;
  border: none;
  cursor: pointer;

  color: var(--color-text-muted);
  font-size: var(--font-size-sm);

  &:hover {
    color: var(--color-text);
  }
}

.empty-message {
  padding: var(--space-4) 0;
  text-align: center;
  color: var(--color-text-muted);
  font-size: var(--font-size-sm);
}

.lobby-meta {
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
