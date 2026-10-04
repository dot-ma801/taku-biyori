import { vi, beforeEach, describe, afterEach, it, expect } from 'vitest';
import { useToast, type ToastVariant } from '@/composables/useToast';

const { toasts, show, dismiss, success, error, warning, info } = useToast();

describe('useToast', () => {
  beforeEach(() => {
    // 時計を偽物に差し替える
    vi.useFakeTimers();
  });

  afterEach(() => {
    // トーストを空にする
    toasts.splice(0);

    // 時計を本物に戻す
    vi.useRealTimers();
  });

  describe('show() は、トーストの追加をする', () => {
    it('メッセージを toast に追加する', () => {
      // Arrange, Act
      show('test');

      // Assert
      expect(toasts[0]!.message).toBe('test');
    });

    it('variant の既定値は info', () => {
      // Arrange, Act
      show('test');

      // Assert
      expect(toasts.some((item) => item.variant == 'info')).toBe(true);
    });

    it('表示時間（duration）の既定値は 4000ms', () => {
      // Arrange, Act
      show('test');

      // Assert
      expect(toasts.some((item) => item.duration == 4000)).toBe(true);
    });

    it('variant の指定ができる', () => {
      // Arrange, Act
      show('test', 'error');

      // Assert
      expect(toasts.some((item) => item.variant == 'error')).toBe(true);
    });

    it('表示時間（duration）の指定ができる', () => {
      // Arrange, Act
      show('test', 'info', 5000);

      // Assert
      expect(toasts.some((item) => item.duration == 5000)).toBe(true);
    });

    it('表示時間が経過と、自動で消える', () => {
      // Arrange, Act
      show('test');
      vi.advanceTimersByTime(4000);

      // Assert
      expect(toasts).toHaveLength(0);
    });

    it('表示時間が経過するまで、自動で消えない', () => {
      // Arrange, Act
      show('test');
      vi.advanceTimersByTime(3999);

      // Assert
      expect(toasts).toHaveLength(1);
    });
  });

  describe('describe() はトーストの削除をする', () => {
    it('メッセージをトーストから削除する', () => {
      // Arrange
      show('test');
      const id = toasts[0]!.id;

      // Act
      dismiss(id);

      // Assert
      expect(toasts).toHaveLength(0);
    });

    it('存在しない id を指定しても、何もおこらない', () => {
      // Arrange
      show('test');

      // Act
      dismiss(-1);

      // Assert
      expect(toasts).toHaveLength(1); // 検証内容これでいいのか？
    });
  });

  describe('各 variant を直接生成するメソッド', () => {
    it.each([
      ['success', success],
      ['error', error],
      ['warning', warning],
      ['info', info],
    ] as const)(
      '%s() メソッドで %s バリアントのトーストが表示される',
      (variant, fn) => {
        // Arrange, Act
        fn('test');

        // Assert
        expect(toasts.some((item) => item.variant == variant)).toBe(true);
      },
    );

    it.each([
      ['success', success],
      ['error', error],
      ['warning', warning],
      ['info', info],
    ] as const)('%s() は表示時間（duration）の指定ができる', (variant, fn) => {
      // Arrange, Act
      fn('test', 5000);

      // Assert
      expect(toasts.some((item) => item.duration == 5000)).toBe(true);
    });
  });
});
