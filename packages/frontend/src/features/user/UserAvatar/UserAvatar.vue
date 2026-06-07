<script setup lang="ts">
import Avatar from 'vue-boring-avatars';
import { useAuthStore } from '@/stores/auth';

const authStore = useAuthStore();

const props = withDefaults(
  defineProps<{
    size?: number;
    variant?: 'marble' | 'beam' | 'pixel' | 'sunset' | 'ring' | 'bauhaus';
  }>(),
  {
    size: 30,
    variant: 'beam',
  },
);
</script>

<template>
  <span
    class="user-avatar"
    :style="{ width: `${props.size}px`, height: `${props.size}px` }"
    aria-hidden="true"
  >
    <Avatar
      :size="props.size"
      :variant="props.variant"
      :name="authStore.user?.name ?? ''"
    />
  </span>
</template>

<style scoped>
.user-avatar {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  border-radius: var(--radius-full);
  overflow: hidden;
  flex-shrink: 0;
}
</style>
