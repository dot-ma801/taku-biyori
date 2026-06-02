<script setup lang="ts">
import { ref } from 'vue';
import BaseButton from '@/components/button/BaseButton.vue';
import BaseCard from '@/components/common/BaseCard/BaseCard.vue';
import BaseDivider from '@/components/common/BaseDivider/BaseDivider.vue';
import BaseTextBox from '@/components/form/BaseTextBox/BaseTextBox.vue';
import BaseAlert from '@/components/common/BaseAlert/BaseAlert.vue';
import GoogleLoginButton from '@/features/user/GoogleLoginButton.vue';
import { signUp } from '@/lib/auth';
import { useAuthForm } from '@/features/user/useAuthForm';

const { errorMessage, submit } = useAuthForm();

const userName = ref<string>('');
const email = ref<string>('');
const password = ref<string>('');

const onClickSignup = () =>
  submit(() =>
    signUp.email({
      name: userName.value,
      email: email.value,
      password: password.value,
    }),
  );
</script>

<template>
  <BaseCard>
    <div class="content">
      <BaseAlert
        v-if="errorMessage"
        title="アカウントの作成に失敗しました"
        variant="error"
      >
        {{
          errorMessage ||
          'メールアドレス または パスワードを再度お確かめください。'
        }}
      </BaseAlert>

      <GoogleLoginButton class="google-login"></GoogleLoginButton>

      <BaseDivider class="base-divider" label="または"></BaseDivider>

      <BaseTextBox
        v-model="userName"
        label="ユーザー名"
        placeholder="卓 日和"
        type="text"
      ></BaseTextBox>
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

      <BaseButton class="login-button" @click="onClickSignup">
        アカウントを作成
      </BaseButton>
    </div>
  </BaseCard>
</template>

<style scoped>
.content {
  display: flex;
  flex-direction: column;
  width: 100%;
  gap: var(--space-2);
}

.google-login {
  margin-bottom: var(--space-2);
}

.base-divider {
  margin: var(--space-2) 0;
}

.login-button {
  margin-top: var(--space-3);
}
</style>
