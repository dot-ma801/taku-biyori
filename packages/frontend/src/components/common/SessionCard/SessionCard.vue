<script setup lang="ts">
import { computed } from 'vue';
import BaseBadge from '@/components/common/BaseBadge/BaseBadge.vue';
import BaseChip from '@/components/common/BaseChip/BaseChip.vue';

type Status = 'recruiting' | 'full' | 'confirmed' | 'ended';

const props = withDefaults(
  defineProps<{
    title: string;
    dateLabel: string;
    location: string;
    status?: Status;
    slotsLabel?: string;
    members?: string[];
    tag?: string;
  }>(),
  {
    status: 'recruiting',
  },
);

const emit = defineEmits<{
  click: [];
}>();

const MAX_MEMBERS = 4;

const STATUS_LABEL: Record<Status, string> = {
  recruiting: '募集中',
  full: '満席',
  confirmed: '開催確定',
  ended: '終了',
};

const STATUS_TONE: Record<
  Status,
  'primary' | 'danger' | 'success' | 'neutral'
> = {
  recruiting: 'primary',
  full: 'danger',
  confirmed: 'success',
  ended: 'neutral',
};

const AVATAR_PALETTE = [
  ['var(--sun-400)', 'var(--sun-600)'],
  ['var(--sora-400)', 'var(--sora-600)'],
  ['var(--moss-400)', 'var(--moss-600)'],
  ['var(--amber-400)', 'var(--amber-600)'],
];

const visibleMembers = computed(() =>
  (props.members ?? []).slice(0, MAX_MEMBERS),
);
const overflowCount = computed(() =>
  Math.max(0, (props.members?.length ?? 0) - MAX_MEMBERS),
);

const statusTone = computed(() => STATUS_TONE[props.status]);
const statusLabel = computed(() => STATUS_LABEL[props.status]);
const metaLine = computed(() => `${props.dateLabel}・${props.location}`);
const showFooter = computed(
  () => Boolean(props.tag) || Boolean(props.slotsLabel),
);

function avatarInitial(name: string) {
  return name.trim().charAt(0) || '?';
}

function avatarGradient(index: number) {
  const pair = AVATAR_PALETTE[index % AVATAR_PALETTE.length]!;
  return `linear-gradient(135deg, ${pair[0]}, ${pair[1]})`;
}

function onClick() {
  emit('click');
}

function onKeydown(event: KeyboardEvent) {
  if (event.key === 'Enter' || event.key === ' ') {
    event.preventDefault();
    emit('click');
  }
}
</script>

<template>
  <div
    class="session-card"
    role="button"
    tabindex="0"
    @click="onClick"
    @keydown="onKeydown"
  >
    <div class="session-card__top">
      <BaseBadge :variant="statusTone">{{ statusLabel }}</BaseBadge>
      <div v-if="visibleMembers.length" class="session-card__members">
        <span
          v-for="(name, index) in visibleMembers"
          :key="`${name}-${index}`"
          class="session-card__avatar"
          :style="{ background: avatarGradient(index) }"
          :title="name"
          aria-hidden="true"
        >
          {{ avatarInitial(name) }}
        </span>
        <span
          v-if="overflowCount > 0"
          class="session-card__avatar session-card__avatar--more"
          aria-hidden="true"
        >
          +{{ overflowCount }}
        </span>
      </div>
    </div>

    <h3 class="session-card__title">{{ title }}</h3>
    <p class="session-card__meta">{{ metaLine }}</p>

    <div v-if="showFooter" class="session-card__footer">
      <BaseChip v-if="tag" size="sm">{{ tag }}</BaseChip>
      <span v-else />
      <span v-if="slotsLabel" class="session-card__slots">{{
        slotsLabel
      }}</span>
    </div>
  </div>
</template>

<style scoped>
.session-card {
  position: relative;
  display: flex;
  flex-direction: column;
  gap: var(--space-2);
  padding: var(--space-5);
  background: var(--surface-card);
  border: 1px solid var(--border-subtle);
  border-radius: var(--radius-md);
  box-shadow: var(--shadow-xs);
  font-family:
    'Zen Kaku Gothic New', 'Hiragino Kaku Gothic ProN', 'Yu Gothic', sans-serif;
  color: var(--text-primary);
  cursor: pointer;
  transition:
    box-shadow var(--duration-base) var(--ease-standard),
    border-color var(--duration-base) var(--ease-standard),
    transform var(--duration-base) var(--ease-standard);
}
.session-card:hover {
  box-shadow: var(--shadow-sm);
  border-color: var(--border-default);
  transform: translateY(-1px);
}
.session-card:focus-visible {
  outline: none;
  box-shadow: var(--focus-ring);
}

.session-card__top {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: var(--space-3);
}

.session-card__members {
  display: flex;
  align-items: center;
}

.session-card__avatar {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 28px;
  height: 28px;
  border-radius: var(--radius-full);
  color: var(--text-inverse);
  font-family:
    'Zen Maru Gothic', 'Hiragino Maru Gothic ProN', 'Rounded Mplus 1c',
    sans-serif;
  font-size: var(--text-xs);
  font-weight: var(--weight-medium);
  border: 2px solid var(--surface-card);
  box-shadow: var(--shadow-xs);
}
.session-card__avatar + .session-card__avatar {
  margin-left: -8px;
}
.session-card__avatar--more {
  background: var(--washi-100) !important;
  color: var(--text-secondary);
}

.session-card__title {
  font-family:
    'Zen Maru Gothic', 'Hiragino Maru Gothic ProN', 'Rounded Mplus 1c',
    sans-serif;
  font-size: var(--text-lg);
  font-weight: var(--weight-medium);
  line-height: var(--leading-snug);
  color: var(--text-primary);
  margin: var(--space-1) 0 0;
}

.session-card__meta {
  font-size: var(--text-xs);
  color: var(--text-tertiary);
  line-height: var(--leading-snug);
  margin: 0;
}

.session-card__footer {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: var(--space-2);
  margin-top: var(--space-2);
}

.session-card__slots {
  font-size: var(--text-xs);
  color: var(--text-secondary);
  font-weight: var(--weight-medium);
}
</style>
