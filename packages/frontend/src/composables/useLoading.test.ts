import { describe, it, expect, afterEach } from 'vitest';
import { useLoading } from '@/composables/useLoading';

const { isLoading, message, start, reset, withLoading } = useLoading();

describe('useLoading', () => {
  afterEach(() => {
    reset();
  });

  describe('初期状態', () => {
    it('ローディング中ではない', () => {
      // Arrange & Act & Assert
      expect(isLoading.value).toBe(false);
    });

    it('メッセージが null である', () => {
      // Arrange & Act & Assert
      expect(message.value).toBeNull();
    });
  });

  describe('start / 解除関数', () => {
    it('start を呼ぶとローディング中になる', () => {
      // Arrange & Act
      start();

      // Assert
      expect(isLoading.value).toBe(true);
    });

    it('解除関数を呼ぶとローディングが終わる', () => {
      // Arrange
      const stop = start();

      // Act
      stop();

      // Assert
      expect(isLoading.value).toBe(false);
    });

    it('多重に start したとき、すべて解除するまでローディング中のままになる', () => {
      // Arrange
      const stopFirst = start();
      const stopSecond = start();

      // Act
      stopFirst();

      // Assert
      expect(isLoading.value).toBe(true);

      // Act
      stopSecond();

      // Assert
      expect(isLoading.value).toBe(false);
    });

    it('同じ解除関数を複数回呼んでも他の処理のカウントを減らさない', () => {
      // Arrange
      const stopFirst = start();
      start();

      // Act
      stopFirst();
      stopFirst();

      // Assert
      expect(isLoading.value).toBe(true);
    });

    it('start にメッセージを渡すと message に反映される', () => {
      // Arrange & Act
      start('ログインしています…');

      // Assert
      expect(message.value).toBe('ログインしています…');
    });

    it('ローディングが終わると message が null に戻る', () => {
      // Arrange
      const stop = start('ログインしています…');

      // Act
      stop();

      // Assert
      expect(message.value).toBeNull();
    });
  });

  describe('reset', () => {
    it('多重に start していても一度でローディングが終わる', () => {
      // Arrange
      start('処理中…');
      start();

      // Act
      reset();

      // Assert
      expect(isLoading.value).toBe(false);
      expect(message.value).toBeNull();
    });

    it('reset 前の解除関数は、reset 後に始まったローディングを解除しない', () => {
      // Arrange
      const stopBeforeReset = start('古い処理…');
      reset();
      start('新しい処理…');

      // Act
      stopBeforeReset();

      // Assert
      expect(isLoading.value).toBe(true);
      expect(message.value).toBe('新しい処理…');
    });
  });

  describe('withLoading', () => {
    it('処理中はローディング中になり、完了すると終わる', async () => {
      // Arrange
      let duringCall = false;

      // Act
      await withLoading(async () => {
        duringCall = isLoading.value;
      });

      // Assert
      expect(duringCall).toBe(true);
      expect(isLoading.value).toBe(false);
    });

    it('処理の戻り値をそのまま返す', async () => {
      // Arrange & Act
      const result = await withLoading(async () => 'ok');

      // Assert
      expect(result).toBe('ok');
    });

    it('処理が失敗したときもローディングを終わらせ、エラーを再送出する', async () => {
      // Arrange
      const failure = async () => {
        throw new Error('失敗しました');
      };

      // Act & Assert
      await expect(withLoading(failure)).rejects.toThrow('失敗しました');
      expect(isLoading.value).toBe(false);
    });

    it('reset をまたいで完了した処理は、後続のローディングを解除しない', async () => {
      // Arrange
      let releasePending: (() => void) | undefined;
      const pending = withLoading(
        () =>
          new Promise<void>((resolve) => {
            releasePending = resolve;
          }),
        '古い処理…',
      );
      reset();
      start('新しい処理…');

      // Act
      releasePending?.();
      await pending;

      // Assert
      expect(isLoading.value).toBe(true);
      expect(message.value).toBe('新しい処理…');
    });
  });
});
