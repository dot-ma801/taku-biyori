import { describe, it, expect, beforeEach } from 'vitest';
import { defineComponent } from 'vue';
import { mount } from '@vue/test-utils';
import { useHideOnScroll } from '@/composables/useHideOnScroll';

type Options = Parameters<typeof useHideOnScroll>[0];

/**
 * onMounted / onUnmounted を使うため、ダミーコンポーネントの setup 内で呼び出す。
 * 返り値をテストから触れるように取り出しておく。
 */
const mountComposable = (options?: Options) => {
  let result!: ReturnType<typeof useHideOnScroll>;

  const wrapper = mount(
    defineComponent({
      setup() {
        result = useHideOnScroll(options);
        return () => null;
      },
    }),
  );

  return { wrapper, result };
};

/** 実際のスクロールを模して scrollY を動かし、scroll イベントを発火する */
const scrollTo = (y: number) => {
  window.scrollY = y;
  window.dispatchEvent(new Event('scroll'));
};

describe('useHideOnScroll', () => {
  beforeEach(() => {
    window.scrollY = 0;
  });

  describe('初期状態', () => {
    it('表示状態から始まる', () => {
      // Arrange & Act
      const { result } = mountComposable();

      // Assert
      expect(result.isVisible.value).toBe(true);
    });

    it('スクロール位置が途中の状態でマウントされても表示状態から始まる', () => {
      // Arrange
      window.scrollY = 500;

      // Act
      const { result } = mountComposable();

      // Assert
      expect(result.isVisible.value).toBe(true);
    });
  });

  describe('下スクロール', () => {
    it('offset を超えて下にスクロールすると非表示になる', () => {
      // Arrange
      const { result } = mountComposable({ offset: 100 });

      // Act
      scrollTo(300);

      // Assert
      expect(result.isVisible.value).toBe(false);
    });

    it('offset 以内の下スクロールでは表示のままになる', () => {
      // Arrange
      const { result } = mountComposable({ offset: 100 });

      // Act
      scrollTo(80);

      // Assert
      expect(result.isVisible.value).toBe(true);
    });

    it('threshold 未満の下スクロールでは表示のままになる', () => {
      // Arrange
      const { result } = mountComposable({ offset: 0, threshold: 10 });

      // Act
      scrollTo(5);

      // Assert
      expect(result.isVisible.value).toBe(true);
    });

    it('threshold 未満の下スクロールでも、積み重なって threshold を超えたら非表示になる', () => {
      // Arrange
      const { result } = mountComposable({ offset: 0, threshold: 10 });

      // Act
      scrollTo(5);
      scrollTo(9);
      scrollTo(12);

      // Assert
      expect(result.isVisible.value).toBe(false);
    });
  });

  describe('上スクロール', () => {
    it('非表示のあと上にスクロールすると再び表示される', () => {
      // Arrange
      const { result } = mountComposable({ offset: 100, threshold: 10 });
      scrollTo(500);

      // Act
      scrollTo(400);

      // Assert
      expect(result.isVisible.value).toBe(true);
    });

    it('threshold 未満の上スクロールでは非表示のままになる', () => {
      // Arrange
      const { result } = mountComposable({ offset: 100, threshold: 10 });
      scrollTo(500);

      // Act
      scrollTo(495);

      // Assert
      expect(result.isVisible.value).toBe(false);
    });

    it('一番上まで戻ると表示される', () => {
      // Arrange
      const { result } = mountComposable({ offset: 100, threshold: 10 });
      scrollTo(500);

      // Act
      scrollTo(0);

      // Assert
      expect(result.isVisible.value).toBe(true);
    });

    it('バウンスで scrollY が負になっても表示のままになる', () => {
      // Arrange
      const { result } = mountComposable({ offset: 100, threshold: 10 });

      // Act
      scrollTo(-50);

      // Assert
      expect(result.isVisible.value).toBe(true);
    });
  });

  describe('後始末', () => {
    it('アンマウント後のスクロールでは状態が変わらない', () => {
      // Arrange
      const { wrapper, result } = mountComposable({ offset: 0, threshold: 10 });

      // Act
      wrapper.unmount();
      scrollTo(500);

      // Assert
      expect(result.isVisible.value).toBe(true);
    });
  });
});
