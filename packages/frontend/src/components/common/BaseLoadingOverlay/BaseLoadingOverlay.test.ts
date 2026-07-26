// このファイルを編集するときは README の「単体テスト項目」も更新が必要か確認してください。
// → ./README.md

import { describe, it, expect, afterEach } from 'vitest';
import { mount } from '@vue/test-utils';
import { nextTick } from 'vue';
import BaseLoadingOverlay from '@/components/common/BaseLoadingOverlay/BaseLoadingOverlay.vue';
import { useLoading } from '@/composables/useLoading';

const { start, reset } = useLoading();

const teleportStub = { template: '<div><slot /></div>' };

const mountOverlay = () =>
  mount(BaseLoadingOverlay, { global: { stubs: { Teleport: teleportStub } } });

describe('BaseLoadingOverlay', () => {
  afterEach(() => {
    reset();
  });

  describe('レンダリング', () => {
    it('ローディング中でないときオーバーレイが表示されない', () => {
      // Arrange & Act
      const wrapper = mountOverlay();

      // Assert
      expect(wrapper.find('.loading-overlay').exists()).toBe(false);
    });

    it('ローディング中のときオーバーレイが表示される', async () => {
      // Arrange
      const wrapper = mountOverlay();

      // Act
      start();
      await nextTick();

      // Assert
      expect(wrapper.find('.loading-overlay').exists()).toBe(true);
    });

    it('スピナーが表示される', async () => {
      // Arrange
      const wrapper = mountOverlay();

      // Act
      start();
      await nextTick();

      // Assert
      expect(wrapper.find('.loading-overlay__spinner').exists()).toBe(true);
    });
  });

  describe('useLoading 連携', () => {
    it('start で渡したメッセージが表示される', async () => {
      // Arrange
      const wrapper = mountOverlay();

      // Act
      start('ログインしています…');
      await nextTick();

      // Assert
      expect(wrapper.find('.loading-overlay__message').text()).toBe(
        'ログインしています…',
      );
    });

    it('メッセージなしで start したとき既定の文言が表示される', async () => {
      // Arrange
      const wrapper = mountOverlay();

      // Act
      start();
      await nextTick();

      // Assert
      expect(wrapper.find('.loading-overlay__message').text()).toBe(
        '読み込み中…',
      );
    });

    it('解除関数の呼び出しでオーバーレイが非表示になる', async () => {
      // Arrange
      const wrapper = mountOverlay();
      const stop = start();
      await nextTick();

      // Act
      stop();
      await nextTick();

      // Assert
      expect(wrapper.find('.loading-overlay').exists()).toBe(false);
    });

    it('多重に start したとき、すべて解除するまで表示され続ける', async () => {
      // Arrange
      const wrapper = mountOverlay();
      const stopFirst = start();
      start();
      await nextTick();

      // Act
      stopFirst();
      await nextTick();

      // Assert
      expect(wrapper.find('.loading-overlay').exists()).toBe(true);
    });
  });

  describe('アクセシビリティ', () => {
    it('role="status" が付与されている', async () => {
      // Arrange
      const wrapper = mountOverlay();

      // Act
      start();
      await nextTick();

      // Assert
      expect(wrapper.find('.loading-overlay').attributes('role')).toBe(
        'status',
      );
    });

    it('aria-live と aria-busy が付与されている', async () => {
      // Arrange
      const wrapper = mountOverlay();

      // Act
      start();
      await nextTick();

      // Assert
      const overlay = wrapper.find('.loading-overlay');
      expect(overlay.attributes('aria-live')).toBe('polite');
      expect(overlay.attributes('aria-busy')).toBe('true');
    });

    it('装飾用のスピナーが aria-hidden になっている', async () => {
      // Arrange
      const wrapper = mountOverlay();

      // Act
      start();
      await nextTick();

      // Assert
      expect(
        wrapper.find('.loading-overlay__spinner').attributes('aria-hidden'),
      ).toBe('true');
    });
  });
});
