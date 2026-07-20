<script setup lang="ts">
import Avatar from 'vue-boring-avatars';
import { computed } from 'vue';
import { useAuthStore } from '@/stores/auth';

const authStore = useAuthStore();

const props = withDefaults(
  defineProps<{
    size?: number;
    variant?: 'marble' | 'beam' | 'pixel' | 'sunset' | 'ring' | 'bauhaus';
    name?: string;
    userId?: string;
  }>(),
  {
    size: 30,
    variant: 'beam',
  },
);

// 模様の種は表示名が変わっても見た目が変化しないよう、可能な限り不変な id を優先する。
// name は id を持たない相手（ゲスト等）向けのフォールバック。
const avatarName = computed(
  () =>
    props.userId ??
    props.name ??
    authStore.user?.id ??
    authStore.user?.name ??
    '',
);
</script>

<template>
  <span
    class="user-avatar"
    :style="{ width: `${props.size}px`, height: `${props.size}px` }"
    aria-hidden="true"
  >
    <Avatar :size="props.size" :variant="props.variant" :name="avatarName" />
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
