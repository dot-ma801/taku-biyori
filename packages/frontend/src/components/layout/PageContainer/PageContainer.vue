<script setup lang="ts">
type Size = 'md' | 'lg';

withDefaults(
  defineProps<{
    size?: Size;
  }>(),
  {
    size: 'md',
  },
);
</script>

<template>
  <div :class="['page-container', `page-container--${size}`]">
    <slot />
  </div>
</template>

<style scoped>
/*
 * 左右の余白は「padding-inline: n%」ではなく max-width + 中央寄せで作る。
 * %余白は画面が広いほど余白だけが育ち、コンテンツも無限に広がってしまうが、
 * max-width 方式なら読みやすい幅で止まり、超過分が自動で左右余白になる。
 */
.page-container {
  width: 100%;
  margin-inline: auto;
  padding-inline: var(--space-4);
}
.page-container--md {
  max-width: 960px;
}
.page-container--lg {
  max-width: 1200px;
}
</style>
