import { describe, it, expect } from 'vitest';
import { PAGE_NAME, isPageName } from '@/config/pageName';

describe('isPageName', () => {
  describe('既知の画面名', () => {
    it.each(Object.values(PAGE_NAME))('"%s" は true になる', (name) => {
      // Arrange & Act & Assert
      expect(isPageName(name)).toBe(true);
    });
  });

  describe('画面名でない値', () => {
    // route.name は string | symbol | undefined を取りうる。
    // 現在地の判定に使う前に、ここで PageName へ絞り込めることを確かめる
    it.each([
      ['未定義のルート名', 'unknown-route'],
      ['空文字', ''],
      ['undefined', undefined],
      ['null', null],
      ['数値', 1],
    ])('%s は false になる', (_label, value) => {
      // Arrange & Act & Assert
      expect(isPageName(value)).toBe(false);
    });

    it('Symbol のルート名は false になる', () => {
      // Arrange & Act & Assert
      expect(isPageName(Symbol('dashboard'))).toBe(false);
    });
  });
});
