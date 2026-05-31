<script setup lang="ts">
import { ref } from 'vue';
import BaseButton from '@/components/button/BaseButton.vue';
import BaseCard from '@/components/common/BaseCard/BaseCard.vue';
import BaseDivider from '@/components/common/BaseDivider/BaseDivider.vue';
import BaseTextBox from '@/components/form/BaseTextBox/BaseTextBox.vue';
import GoogleLoginButton from '@/features/user/GoogleLoginButton.vue';

const email = ref<string>('');
const password = ref<string>('');
</script>

<template>
  <BaseCard>
    <div class="content">
      <GoogleLoginButton class="google-login"></GoogleLoginButton>

      <BaseDivider class="base-divider" label="または"></BaseDivider>

      <BaseTextBox
        v-model="email"
        label="メールアドレス"
        placeholder="example@email.com"
        type="email"
      ></BaseTextBox>
      <BaseTextBox
        v-model="password"
        label="パスワード"
        type="password"
      ></BaseTextBox>

      <BaseButton class="login-button">ログイン</BaseButton>
    </div>
  </BaseCard>
</template>

<style scoped>
.content {
  display: flex;
  flex-direction: column;
  width: 100%;
  gap: var(--space-2)
}

.google-login {
  margin-bottom: var(--space-2)
}

.base-divider {
  margin: var(--space-2) 0;
}

.login-button {
  margin-top: var(--space-3)
}
</style>
