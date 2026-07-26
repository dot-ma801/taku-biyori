<script setup lang="ts">
import ThemeSwitchButton from '@/components/layout/ThemeSwitchButton.vue';
import LoginButton from '@/features/user/LoginButton.vue';
import { useRouter } from 'vue-router';

const router = useRouter();

const onClickTitle = () => {
  router.push({ name: 'dashboard' });
};
</script>

<template>
  <header>
    <h1 @click="onClickTitle">たく日和</h1>
    <div class="button-area">
      <ThemeSwitchButton />
      <LoginButton />
    </div>
  </header>
</template>

<style scoped>
header {
  background-color: var(--color-primary);
  padding: var(--space-4);
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
  display: flex;
  align-items: center;
  justify-content: space-between;
}

h1 {
  font-size: 1.5rem;
  color: var(--color-on-primary);
  margin: 0;
  cursor: pointer;
}

.button-area {
  display: flex;
  gap: var(--space-4);
}
</style>
