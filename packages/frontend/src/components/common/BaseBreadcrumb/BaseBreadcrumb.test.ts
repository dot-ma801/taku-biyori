// このファイルを編集するときは README の「単体テスト項目」も更新が必要か確認してください。
// → ./README.md

import { describe, it, expect } from 'vitest';
import { mount, RouterLinkStub } from '@vue/test-utils';
import BaseBreadcrumb from '@/components/common/BaseBreadcrumb/BaseBreadcrumb.vue';
import type { BreadcrumbItem } from '@/components/common/BaseBreadcrumb/BaseBreadcrumb.vue';

const items: BreadcrumbItem[] = [
  { label: 'ダッシュボード', to: { name: 'dashboard' } },
  { label: '週末のロビー', to: { name: 'lobbies-detail' } },
  { label: '開催の詳細' },
];

const mountBreadcrumb = (props: { items: BreadcrumbItem[]; label?: string }) =>
  mount(BaseBreadcrumb, {
    props,
    global: { stubs: { RouterLink: RouterLinkStub } },
  });

describe('BaseBreadcrumb', () => {
  describe('レンダリング', () => {
    it('渡した項目をすべて表示する', () => {
      // Arrange & Act
      const wrapper = mountBreadcrumb({ items });

      // Assert
      expect(wrapper.findAll('.breadcrumb__item')).toHaveLength(3);
      expect(wrapper.text()).toContain('ダッシュボード');
      expect(wrapper.text()).toContain('開催の詳細');
    });

    it('項目が1件だけでも表示できる', () => {
      // Arrange & Act
      const wrapper = mountBreadcrumb({ items: [{ label: 'ロビー' }] });

      // Assert
      expect(wrapper.findAll('.breadcrumb__item')).toHaveLength(1);
    });
  });

  describe('items', () => {
    it('末尾以外の項目はリンクになる', () => {
      // Arrange & Act
      const wrapper = mountBreadcrumb({ items });

      // Assert
      expect(wrapper.findAllComponents(RouterLinkStub)).toHaveLength(2);
    });

    it('末尾の項目は to があってもリンクにしない', () => {
      // Arrange & Act
      const wrapper = mountBreadcrumb({
        items: [
          { label: 'ダッシュボード', to: { name: 'dashboard' } },
          { label: '現在地', to: { name: 'lobbies-detail' } },
        ],
      });

      // Assert
      expect(wrapper.findAllComponents(RouterLinkStub)).toHaveLength(1);
      expect(wrapper.find('.breadcrumb__current').text()).toBe('現在地');
    });

    it('to を持たない中間の項目はリンクにしない', () => {
      // Arrange & Act
      const wrapper = mountBreadcrumb({
        items: [{ label: '親' }, { label: '子', to: { name: 'dashboard' } }],
      });

      // Assert
      expect(wrapper.findAllComponents(RouterLinkStub)).toHaveLength(0);
    });

    it('末尾以外には区切りのアイコンが入る', () => {
      // Arrange & Act
      const wrapper = mountBreadcrumb({ items });

      // Assert
      expect(wrapper.findAll('.breadcrumb__separator')).toHaveLength(2);
    });
  });

  describe('アクセシビリティ', () => {
    it('nav に既定のアクセシブルネームが付く', () => {
      // Arrange & Act
      const wrapper = mountBreadcrumb({ items });

      // Assert
      expect(wrapper.find('nav').attributes('aria-label')).toBe(
        'パンくずリスト',
      );
    });

    it('label を渡すとアクセシブルネームを差し替えられる', () => {
      // Arrange & Act
      const wrapper = mountBreadcrumb({ items, label: '現在の階層' });

      // Assert
      expect(wrapper.find('nav').attributes('aria-label')).toBe('現在の階層');
    });

    it('末尾の項目に aria-current="page" が付く', () => {
      // Arrange & Act
      const wrapper = mountBreadcrumb({ items });

      // Assert
      expect(
        wrapper.find('.breadcrumb__current').attributes('aria-current'),
      ).toBe('page');
    });

    it('区切りのアイコンは aria-hidden にする', () => {
      // Arrange & Act
      const wrapper = mountBreadcrumb({ items });

      // Assert
      expect(
        wrapper.find('.breadcrumb__separator').attributes('aria-hidden'),
      ).toBe('true');
    });
  });
});
