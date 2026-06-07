// このファイルを編集するときは README の「単体テスト項目」も更新が必要か確認してください。
// → ./README.md

import { describe, it, expect } from 'vitest';
import { mount } from '@vue/test-utils';
import { createPinia, setActivePinia } from 'pinia';
import UserAvatar from '@/features/user/UserAvatar/UserAvatar.vue';

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
});
