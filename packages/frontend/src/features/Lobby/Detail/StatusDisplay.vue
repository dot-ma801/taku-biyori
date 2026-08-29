<script setup lang="ts">
import BaseCard from '@/components/common/BaseCard/BaseCard.vue';
import BaseSectionHeading from '@/components/common/BaseSectionHeading/BaseSectionHeading.vue';
import { LobbyStatus } from '@taku-biyori/shared';
import { useLobbyStatusAppearance } from '@/features/Lobby/Detail/composables/useLobbyStatusAppearance';

const props = defineProps<{ lobbyStatus: LobbyStatus }>();

const { appearance } = useLobbyStatusAppearance(() => props.lobbyStatus);
</script>

<template>
  <BaseCard :data-variant="appearance.variant" class="status-card">
    <div class="left-area">
      <div class="icon-wrapper">
        <component class="icon" :is="appearance.icon" />
      </div>
      <BaseSectionHeading class="title-text" level="h3">
        {{ appearance.label }}
      </BaseSectionHeading>
      <p class="description-text">{{ appearance.text }}</p>
    </div>
  </BaseCard>
</template>

<style scoped>
.status-card {
  --status-color: var(--color-secondary);
  --status-bg: var(--color-surface-muted);
  --status-bg-subtle: color-mix(
    in srgb,
    var(--status-bg) 40%,
    var(--color-surface)
  );
}

[data-variant='primary'] {
  --status-color: var(--color-primary);
  --status-bg: var(--color-primary-soft);
}
[data-variant='warning'] {
  --status-color: var(--color-warning);
  --status-bg: var(--color-warning-soft);
}
[data-variant='success'] {
  --status-color: var(--color-success);
  --status-bg: var(--color-success-soft);
}
[data-variant='error'] {
  --status-color: var(--color-error);
  --status-bg: var(--color-error-soft);
}

/* .status-card[data-variant] の specificity (0,2,0) が
   BaseCard 内の .card (0,1,0) より高いので :deep() 不要 */
.status-card[data-variant] {
  border-left: 3px solid var(--status-color);
  background: var(--status-bg-subtle);
}

.left-area {
  display: grid;
  grid-template-columns: auto 1fr;
  grid-template-rows: auto 1fr;
  align-items: center;
  gap: var(--space-1);

  .icon-wrapper {
    grid-column: 1 / 2;
    grid-row: 1 / -1;

    display: flex;
    align-items: center;
    justify-content: center;
    padding: var(--space-2);
    background: var(--status-bg);
    border-radius: var(--radius-sm);
    margin-right: var(--space-2);
  }

  .icon {
    color: var(--status-color);
  }
  .title-text {
    grid-column: 2 / 3;
    grid-row: 1 / 2;
  }
  .description-text {
    grid-column: 2 / 3;
    grid-row: 2 / 3;
    margin: 0;
  }
}
</style>
