// このファイルを編集するときは README の「単体テスト項目」も更新が必要か確認してください。
// → ./README.md

import { describe, it, expect } from 'vitest';
import { mount } from '@vue/test-utils';
import { Inbox } from '@lucide/vue';
import EmptyState from '@/components/common/EmptyState/EmptyState.vue';

describe('EmptyState', () => {
  describe('レンダリング', () => {
    it('タイトルが表示される', () => {
      // Arrange & Act
      const wrapper = mount(EmptyState, {
        props: { title: 'まだ卓がありません' },
      });

      // Assert
      expect(wrapper.find('.empty-state__title').text()).toBe(
        'まだ卓がありません',
      );
    });

    it('description が表示される', () => {
      // Arrange & Act
      const wrapper = mount(EmptyState, {
        props: { title: 'まだ卓がありません', description: '最初の卓を作成' },
      });

      // Assert
      expect(wrapper.find('.empty-state__description').text()).toBe(
        '最初の卓を作成',
      );
    });

    it('icon prop を渡すとアイコンサークルが表示される', () => {
      // Arrange & Act
      const wrapper = mount(EmptyState, {
        props: { title: '空', icon: Inbox },
      });

      // Assert
      expect(wrapper.find('.empty-state__icon-circle').exists()).toBe(true);
    });

    it('icon prop がないとアイコンサークルが表示されない', () => {
      // Arrange & Act
      const wrapper = mount(EmptyState, { props: { title: '空' } });

      // Assert
      expect(wrapper.find('.empty-state__icon-circle').exists()).toBe(false);
    });

    it('default スロットの内容が actions として表示される', () => {
      // Arrange & Act
      const wrapper = mount(EmptyState, {
        props: { title: '空' },
        slots: { default: '<button class="cta">作る</button>' },
      });

      // Assert
      expect(wrapper.find('.empty-state__actions .cta').exists()).toBe(true);
    });
  });
});
