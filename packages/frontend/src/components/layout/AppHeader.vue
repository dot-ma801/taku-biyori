<script setup lang="ts">
import ThemeSwitchButton from '@/components/layout/ThemeSwitchButton.vue';
import LoginButton from '@/features/user/LoginButton.vue';
import { useRouter } from 'vue-router';

const router = useRouter();

const onClickTitle = () => {
  router.push('/');
};
</script>

<template>
  <header class="app-header">
    <div class="app-header__inner">
      <button class="app-header__brand" type="button" @click="onClickTitle">
        <span class="app-header__mark">た</span>
        <span class="app-header__wordmark">たく日和</span>
      </button>
      <div class="app-header__actions">
        <ThemeSwitchButton />
        <LoginButton />
      </div>
    </div>
  </header>
</template>

<style scoped>
.app-header {
  background: var(--surface-card);
  border-bottom: 1px solid var(--border-subtle);
  backdrop-filter: blur(12px);
}

.app-header__inner {
  max-width: var(--container-max);
  margin: 0 auto;
  height: var(--header-height);
  padding: 0 var(--space-4);
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: var(--space-4);
}

.app-header__brand {
  display: inline-flex;
  align-items: center;
  gap: var(--space-2);
  background: none;
  border: none;
  cursor: pointer;
  padding: var(--space-1) var(--space-2);
  border-radius: var(--radius-md);
  transition: background var(--duration-fast) var(--ease-standard);
}

.app-header__brand:hover {
  background: var(--brand-primary-soft);
}

.app-header__mark {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 32px;
  height: 32px;
  border-radius: var(--radius-full);
  background: var(--brand-primary);
  color: var(--text-inverse);
  font-family: var(--font-display);
  font-weight: var(--weight-bold);
  font-size: var(--text-md);
}

.app-header__wordmark {
  font-family: var(--font-display);
  font-weight: var(--weight-bold);
  font-size: var(--text-lg);
  color: var(--text-primary);
  letter-spacing: var(--tracking-normal);
}

.app-header__actions {
  display: flex;
  align-items: center;
  gap: var(--space-2);
}
</style>
