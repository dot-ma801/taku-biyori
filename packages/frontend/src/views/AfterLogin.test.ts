import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { mount, flushPromises } from '@vue/test-utils';
import { createPinia, setActivePinia } from 'pinia';

const mockPush = vi.hoisted(() => vi.fn());
const mockToastError = vi.hoisted(() => vi.fn());
const mockInitSession = vi.hoisted(() => vi.fn());
const authState = vi.hoisted(() => ({ isAuthenticated: false }));

vi.mock('vue-router', () => ({
  useRouter: () => ({ push: mockPush }),
}));

vi.mock('@/composables/useToast', () => ({
  useToast: () => ({ error: mockToastError }),
}));

vi.mock('@/stores/auth', () => ({
  useAuthStore: () => ({
    initSession: mockInitSession,
    get isAuthenticated() {
      return authState.isAuthenticated;
    },
  }),
}));

import AfterLogin from '@/views/AfterLogin.vue';
import { useLoading } from '@/composables/useLoading';

const { isLoading, message, reset } = useLoading();

describe('AfterLogin', () => {
  beforeEach(() => {
    setActivePinia(createPinia());
    mockPush.mockReset();
    mockToastError.mockReset();
    authState.isAuthenticated = true;
    mockInitSession.mockResolvedValue(undefined);
  });

  afterEach(() => {
    reset();
  });

  describe('ローディング表示', () => {
    it('マウント直後はローディング中になる', () => {
      // Arrange & Act
      mount(AfterLogin);

      // Assert
      expect(isLoading.value).toBe(true);
      expect(message.value).toBe('ログイン中…');
    });

    it('遷移が終わるとローディングが解除される', async () => {
      // Arrange
      mount(AfterLogin);

      // Act
      await flushPromises();

      // Assert
      expect(isLoading.value).toBe(false);
    });

    it('未認証で login に戻されたときもローディングが解除される', async () => {
      // Arrange
      authState.isAuthenticated = false;
      mount(AfterLogin);

      // Act
      await flushPromises();

      // Assert
      expect(isLoading.value).toBe(false);
      expect(mockToastError).toHaveBeenCalled();
      expect(mockPush).toHaveBeenCalledWith({ name: 'login' });
    });
  });

  describe('遷移先', () => {
    it('認証済みのとき既定で dashboard へ遷移する', async () => {
      // Arrange
      mount(AfterLogin);

      // Act
      await flushPromises();

      // Assert
      expect(mockPush).toHaveBeenCalledWith({ name: 'dashboard' });
    });

    it('nextPage が指定されているときそのページへ遷移する', async () => {
      // Arrange
      mount(AfterLogin, { props: { nextPage: 'profile' } });

      // Act
      await flushPromises();

      // Assert
      expect(mockPush).toHaveBeenCalledWith({ name: 'profile' });
    });
  });
});
