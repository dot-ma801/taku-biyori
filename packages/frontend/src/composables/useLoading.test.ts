import { describe, it, expect, afterEach } from 'vitest';
import { useLoading } from '@/composables/useLoading';

const { isLoading, message, start, stop, reset, withLoading } = useLoading();

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

  describe('start / stop', () => {
    it('start を呼ぶとローディング中になる', () => {
      // Arrange & Act
      start();

      // Assert
      expect(isLoading.value).toBe(true);
    });

    it('start と同じ回数だけ stop を呼ぶとローディングが終わる', () => {
      // Arrange
      start();

      // Act
      stop();

      // Assert
      expect(isLoading.value).toBe(false);
    });

    it('多重に start したとき、すべて stop するまでローディング中のままになる', () => {
      // Arrange
      start();
      start();

      // Act
      stop();

      // Assert
      expect(isLoading.value).toBe(true);

      // Act
      stop();

      // Assert
      expect(isLoading.value).toBe(false);
    });

    it('start より多く stop を呼んでもカウントがマイナスにならない', () => {
      // Arrange
      stop();
      stop();

      // Act
      start();

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
      start('ログインしています…');

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
  });
});
