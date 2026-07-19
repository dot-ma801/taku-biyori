<script setup lang="ts">
import BaseCheckbox from '@/components/form/BaseCheckbox/BaseCheckbox.vue';
import { memberDisplayName } from '@/utils/memberDisplayName';
import type { LobbyMember } from '@taku-biyori/shared';
import { AlertTriangle } from '@lucide/vue';

const props = defineProps<{
  members: LobbyMember[];
  selectedMemberIds: Set<string>;
  isWarnedMember: (memberId: string) => boolean;
}>();

const emit = defineEmits<{
  toggle: [id: string];
}>();
</script>

<template>
  <p class="step-label">参加者を選んでください</p>
  <ul class="member-list">
    <li v-for="member in members" :key="member.id" class="member-item">
      <label class="member-label">
        <BaseCheckbox
          :model-value="selectedMemberIds.has(member.id)"
          @update:model-value="emit('toggle', member.id)"
        />
        <span class="member-name">{{ memberDisplayName(member) }}</span>
        <span v-if="props.isWarnedMember(member.id)" class="warn">
          <AlertTriangle :size="14" />
          ×・未回答
        </span>
      </label>
    </li>
  </ul>
</template>

<style scoped>
.step-label {
  font-size: 13px;
  color: var(--color-text-muted);
  margin: 0 0 var(--space-3);
}

.member-list {
  list-style: none;
  margin: 0;
  padding: 0;
  display: flex;
  flex-direction: column;
  gap: var(--space-2);
}

.member-item {
  padding: var(--space-2) var(--space-3);
  border: 1px solid var(--color-border);
  border-radius: var(--radius-md);
}

.member-label {
  display: flex;
  align-items: center;
  gap: var(--space-2);
  cursor: pointer;
  font-size: 14px;
  width: 100%;
}

.member-name {
  flex: 1;
}

.warn {
  display: flex;
  align-items: center;
  gap: var(--space-1);
  font-size: 12px;
  color: var(--color-warning, #bf8700);
}
</style>
