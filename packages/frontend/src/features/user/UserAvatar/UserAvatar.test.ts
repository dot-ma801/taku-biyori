// このファイルを編集するときは README の「単体テスト項目」も更新が必要か確認してください。
// → ./README.md

import { describe, it, expect } from 'vitest';
import { mount } from '@vue/test-utils';
import { createPinia, setActivePinia } from 'pinia';
import Avatar from 'vue-boring-avatars';
import UserAvatar from '@/features/user/UserAvatar/UserAvatar.vue';
import { useAuthStore } from '@/stores/auth';
import type { User } from '@taku-biyori/shared';

function makeUser(overrides: Partial<User> = {}): User {
  return {
    id: 'store-user-1',
    name: 'ストアユーザー',
    email: 'store-user@example.com',
    emailVerified: true,
    image: null,
    createdAt: new Date('2026-01-01T00:00:00Z'),
    updatedAt: new Date('2026-01-01T00:00:00Z'),
    ...overrides,
  };
}

describe('UserAvatar', () => {
  describe('レンダリング', () => {
    it('デフォルト props でレンダリングされる', () => {
      // Arrange
      setActivePinia(createPinia());

      // Act
      const wrapper = mount(UserAvatar);

      // Assert
      expect(wrapper.find('.user-avatar').exists()).toBe(true);
    });

    it('size に応じた width/height スタイルが設定される', () => {
      // Arrange
      setActivePinia(createPinia());

      // Act
      const wrapper = mount(UserAvatar, { props: { size: 48 } });

      // Assert
      const el = wrapper.find('.user-avatar');
      expect(el.attributes('style')).toContain('width: 48px');
      expect(el.attributes('style')).toContain('height: 48px');
    });
  });

  describe('アクセシビリティ', () => {
    it('aria-hidden が付与されている', () => {
      // Arrange
      setActivePinia(createPinia());

      // Act
      const wrapper = mount(UserAvatar);

      // Assert
      expect(wrapper.find('.user-avatar').attributes('aria-hidden')).toBe(
        'true',
      );
    });
  });

  describe('アバターの種（seed）の優先順位', () => {
    it('userId prop が最優先で使われる', () => {
      // Arrange
      setActivePinia(createPinia());
      const authStore = useAuthStore();
      authStore.user = makeUser();

      // Act
      const wrapper = mount(UserAvatar, {
        props: { userId: 'explicit-id', name: 'explicit-name' },
      });

      // Assert
      expect(wrapper.findComponent(Avatar).props('name')).toBe('explicit-id');
    });

    it('userId が無いときは name prop が使われる', () => {
      // Arrange
      setActivePinia(createPinia());
      const authStore = useAuthStore();
      authStore.user = makeUser();

      // Act
      const wrapper = mount(UserAvatar, {
        props: { name: 'explicit-name' },
      });

      // Assert
      expect(wrapper.findComponent(Avatar).props('name')).toBe('explicit-name');
    });

    it('userId が null のときは name prop が使われる（ゲスト向けのフォールバック）', () => {
      // Arrange
      setActivePinia(createPinia());
      const authStore = useAuthStore();
      authStore.user = makeUser();

      // Act
      const wrapper = mount(UserAvatar, {
        props: { userId: null, name: 'ゲスト太郎' },
      });

      // Assert
      expect(wrapper.findComponent(Avatar).props('name')).toBe('ゲスト太郎');
    });

    it('props が無いときは authStore.user.id が使われる（表示名が変わっても見た目を維持するため）', () => {
      // Arrange
      setActivePinia(createPinia());
      const authStore = useAuthStore();
      authStore.user = makeUser({ id: 'user-id-1', name: '表示名' });

      // Act
      const wrapper = mount(UserAvatar);

      // Assert
      expect(wrapper.findComponent(Avatar).props('name')).toBe('user-id-1');
    });

    it('props も authStore.user も無いときは空文字にフォールバックする', () => {
      // Arrange
      setActivePinia(createPinia());

      // Act
      const wrapper = mount(UserAvatar);

      // Assert
      expect(wrapper.findComponent(Avatar).props('name')).toBe('');
    });
  });
});
