import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { mount } from '@vue/test-utils';
import { nextTick } from 'vue';

const mockSignInSocial = vi.hoisted(() => vi.fn());

vi.mock('@/lib/auth', () => ({
  authClient: { signIn: { social: mockSignInSocial } },
}));

import GoogleLoginButton from '@/features/user/GoogleLoginButton.vue';
import { useLoading } from '@/composables/useLoading';

const { isLoading, message, reset } = useLoading();

describe('GoogleLoginButton', () => {
  beforeEach(() => {
    mockSignInSocial.mockReset();
    mockSignInSocial.mockResolvedValue({ data: null, error: null });
  });

  afterEach(() => {
    reset();
  });

  describe('ローディング表示', () => {
    it('クリックしたときローディングが開始される', async () => {
      // Arrange
      const wrapper = mount(GoogleLoginButton);

      // Act
      await wrapper.find('button').trigger('click');

      // Assert
      expect(isLoading.value).toBe(true);
      expect(message.value).toBe('Google に接続しています…');
    });

    it('リダイレクトに成功したときはローディングを解除しない', async () => {
      // Arrange
      const wrapper = mount(GoogleLoginButton);

      // Act
      await wrapper.find('button').trigger('click');
      await nextTick();

      // Assert
      expect(isLoading.value).toBe(true);
    });

    it('サインインが例外を投げたときローディングが解除される', async () => {
      // Arrange
      mockSignInSocial.mockRejectedValue(new Error('ネットワークエラー'));
      const wrapper = mount(GoogleLoginButton);

      // Act
      await wrapper.find('button').trigger('click');
      await nextTick();

      // Assert
      expect(isLoading.value).toBe(false);
    });

    it('サインインがエラーを返したときローディングが解除される', async () => {
      // Arrange
      mockSignInSocial.mockResolvedValue({
        data: null,
        error: { message: '認証に失敗しました' },
      });
      const wrapper = mount(GoogleLoginButton);

      // Act
      await wrapper.find('button').trigger('click');
      await nextTick();

      // Assert
      expect(isLoading.value).toBe(false);
    });

    it('ローディング中はボタンが無効化される', async () => {
      // Arrange
      const wrapper = mount(GoogleLoginButton);

      // Act
      await wrapper.find('button').trigger('click');

      // Assert
      expect(wrapper.find('button').attributes('disabled')).toBeDefined();
    });
  });

  describe('bfcache 復帰', () => {
    it('ブラウザバックで復帰したときローディングが強制解除される', async () => {
      // Arrange
      mount(GoogleLoginButton);
      const { start } = useLoading();
      start('Google に接続しています…');

      // Act
      window.dispatchEvent(
        new PageTransitionEvent('pageshow', { persisted: true }),
      );
      await nextTick();

      // Assert
      expect(isLoading.value).toBe(false);
    });
  });
});
