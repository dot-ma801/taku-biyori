<template>
  <div class="login-container">
    <h1>{{ isSignInMode ? 'ログイン' : '新規登録' }}</h1>

    <div v-if="authStore.isAuthenticated" class="authenticated">
      <p>ログイン中: {{ authStore.currentUser?.email }}</p>
      <button @click="handleLogout">ログアウト</button>
    </div>

    <div v-else class="login-form">
      <div class="form-group">
        <label>メール</label>
        <input v-model="email" type="email" placeholder="test@example.com" />
      </div>

      <div class="form-group">
        <label>パスワード</label>
        <input v-model="password" type="password" placeholder="password" />
      </div>

      <button @click="handleSubmit" :disabled="loading">
        {{
          loading
            ? isSignInMode
              ? 'ログイン中...'
              : '登録中...'
            : isSignInMode
              ? 'ログイン'
              : '新規登録'
        }}
      </button>

      <button
        @click="handleGoogleSignIn"
        :disabled="loading"
        class="google-btn"
      >
        Google でログイン
      </button>

      <button @click="toggleMode" :disabled="loading" class="secondary-btn">
        {{ isSignInMode ? 'アカウントを作成する' : 'ログインに戻る' }}
      </button>

      <p v-if="error" class="error">{{ error }}</p>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, ref } from 'vue';
import { useAuthStore } from '@/stores/auth';
import { authClient, signIn, signUp } from '@/lib/auth';

const authStore = useAuthStore();
const email = ref('');
const password = ref('');
const loading = ref(false);
const error = ref('');
const mode = ref<'signin' | 'signup'>('signin');

const isSignInMode = computed(() => mode.value === 'signin');

const toggleMode = () => {
  mode.value = isSignInMode.value ? 'signup' : 'signin';
  error.value = '';
};

const handleSubmit = async () => {
  loading.value = true;
  error.value = '';

  try {
    const result = isSignInMode.value
      ? await signIn.email({
          email: email.value,
          password: password.value,
        })
      : await signUp.email({
          name: email.value,
          email: email.value,
          password: password.value,
        });

    if (result) {
      await authStore.initSession();
    }
  } catch (err) {
    error.value =
      err instanceof Error
        ? err.message
        : isSignInMode.value
          ? 'ログインに失敗しました'
          : '新規登録に失敗しました';
  } finally {
    loading.value = false;
  }
};

const handleGoogleSignIn = async () => {
  loading.value = true;
  error.value = '';

  try {
    await authClient.signIn.social({
      provider: 'google',
      callbackURL: `${window.location.origin}/auth/callback`,
    });
  } catch (err) {
    error.value =
      err instanceof Error ? err.message : 'Google ログインに失敗しました';
  } finally {
    loading.value = false;
  }
};

const handleLogout = async () => {
  await authStore.logout();
};

authStore.initSession();
</script>

<style scoped>
.login-container {
  max-width: 400px;
  margin: 50px auto;
  padding: 20px;
  border: 1px solid #ccc;
  border-radius: 8px;
}

h1 {
  text-align: center;
}

.form-group {
  margin-bottom: 15px;
}

label {
  display: block;
  margin-bottom: 5px;
  font-weight: bold;
}

input {
  width: 100%;
  padding: 8px;
  border: 1px solid #ddd;
  border-radius: 4px;
  box-sizing: border-box;
}

button {
  width: 100%;
  padding: 10px;
  margin-top: 10px;
  background-color: #007bff;
  color: white;
  border: none;
  border-radius: 4px;
  cursor: pointer;
  font-size: 14px;
}

button:hover:not(:disabled) {
  background-color: #0056b3;
}

button:disabled {
  background-color: #ccc;
  cursor: not-allowed;
}

.secondary-btn {
  background-color: #6c757d;
}

.secondary-btn:hover:not(:disabled) {
  background-color: #5a6268;
}

.google-btn {
  background-color: #db4437;
}

.google-btn:hover:not(:disabled) {
  background-color: #c1351c;
}

.error {
  color: red;
  margin-top: 10px;
}

.authenticated {
  text-align: center;
}
</style>
