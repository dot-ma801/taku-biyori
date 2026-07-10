<script setup lang="ts"></script>

<template>
  <footer class="app-footer">
    <div class="app-footer__inner">
      <span class="app-footer__wordmark">たく日和</span>
      <span class="app-footer__note">
        今日も、卓を囲むみなさんに晴れの日を。
      </span>
    </div>
  </footer>
</template>

<style scoped>
.app-footer {
  background: var(--surface-card);
  border-top: 1px solid var(--border-subtle);
}

.app-footer__inner {
  max-width: var(--container-max);
  margin: 0 auto;
  padding: var(--space-4);
  display: flex;
  flex-wrap: wrap;
  gap: var(--space-3);
  justify-content: space-between;
  align-items: center;
  color: var(--text-tertiary);
  font-size: var(--text-xs);
}

.app-footer__wordmark {
  font-family: var(--font-display);
  font-weight: var(--weight-bold);
  color: var(--text-secondary);
}
</style>
