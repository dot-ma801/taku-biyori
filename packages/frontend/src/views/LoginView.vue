<script setup lang="ts">
import LoginCard from '@/features/user/LoginCard.vue';
</script>

<template>
  <div class="container">
    <LoginCard class="login-card"></LoginCard>
  </div>
</template>

<style scoped>
.container {
  height: 100%;
  padding: 0 var(--space-7);
  align-items: center;

  display: flex;
  justify-content: center;
}

.login-card {
  width: 400px;
  margin-bottom: 100px;
}
</style>
