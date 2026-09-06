<script setup lang="ts">
import { computed } from 'vue';
import { LoaderCircle } from '@lucide/vue';
import { useLoading } from '@/composables/useLoading';

const { isLoading, message } = useLoading();

const displayMessage = computed(() => message.value ?? '読み込み中…');
</script>

<template>
  <Teleport to="body">
    <Transition name="loading-overlay">
      <div
        v-if="isLoading"
        class="loading-overlay"
        role="status"
        aria-live="polite"
        aria-busy="true"
      >
        <div class="loading-overlay__panel">
          <LoaderCircle
            :size="28"
            class="loading-overlay__spinner"
            aria-hidden="true"
          />
          <p class="loading-overlay__message">{{ displayMessage }}</p>
        </div>
      </div>
    </Transition>
  </Teleport>
</template>

<style scoped>
.loading-overlay {
  position: fixed;
  inset: 0;
  /* トースト (9999) より下、ヘッダー/フッター (100) より上 */
  z-index: 9998;
  display: flex;
  align-items: center;
  justify-content: center;
  background: color-mix(in srgb, var(--color-background) 72%, transparent);
  font-family: var(--font-family-base);
}

.loading-overlay__panel {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: var(--space-3);
  min-width: 180px;
  padding: var(--space-6) var(--space-8);
  background: var(--color-surface);
  border: 1px solid var(--color-border);
  border-radius: var(--radius-md);
  box-shadow: var(--shadow-md);
}

.loading-overlay__spinner {
  color: var(--color-primary-text);
  animation: loading-overlay-spin 0.9s linear infinite;
}

.loading-overlay__message {
  margin: 0;
  font-size: var(--font-size-sm);
  font-weight: 500;
  line-height: var(--line-height-tight);
  color: var(--color-text-secondary);
  text-align: center;
}

@keyframes loading-overlay-spin {
  from {
    transform: rotate(0deg);
  }
  to {
    transform: rotate(360deg);
  }
}

/* transitions */
.loading-overlay-enter-active,
.loading-overlay-leave-active {
  transition: opacity 0.15s ease;
}
.loading-overlay-enter-from,
.loading-overlay-leave-to {
  opacity: 0;
}

@media (prefers-reduced-motion: reduce) {
  .loading-overlay__spinner {
    animation-duration: 2.4s;
  }
  .loading-overlay-enter-active,
  .loading-overlay-leave-active {
    transition: none;
  }
}
</style>
