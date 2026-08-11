import { describe, expect, it } from 'vitest';
import {
  DATE_NOTE_MAX_LENGTH,
  DateNoteSchema,
  normalizeDateNote,
} from '@/lobby/date-note';

describe('normalizeDateNote', () => {
  it('前後の空白を落とした文字列を返す', () => {
    // Arrange
    const input = '  13:00〜17:00  ';

    // Act
    const result = normalizeDateNote(input);

    // Assert
    expect(result).toBe('13:00〜17:00');
  });

  it('空文字は null になる', () => {
    // Arrange
    const input = '';

    // Act
    const result = normalizeDateNote(input);

    // Assert
    expect(result).toBeNull();
  });

  it('空白のみは null になる', () => {
    // Arrange
    const input = '　 \t ';

    // Act
    const result = normalizeDateNote(input);

    // Assert
    expect(result).toBeNull();
  });

  it('null はそのまま null を返す', () => {
    // Arrange
    const input = null;

    // Act
    const result = normalizeDateNote(input);

    // Assert
    expect(result).toBeNull();
  });

  it('undefined は null を返す', () => {
    // Arrange
    const input = undefined;

    // Act
    const result = normalizeDateNote(input);

    // Assert
    expect(result).toBeNull();
  });
});

describe('DateNoteSchema', () => {
  it('上限ちょうどの文字数を受け付ける', () => {
    // Arrange
    const input = 'あ'.repeat(DATE_NOTE_MAX_LENGTH);

    // Act
    const result = DateNoteSchema.safeParse(input);

    // Assert
    expect(result.success).toBe(true);
  });

  it('上限を超える文字数を拒否する', () => {
    // Arrange
    const input = 'あ'.repeat(DATE_NOTE_MAX_LENGTH + 1);

    // Act
    const result = DateNoteSchema.safeParse(input);

    // Assert
    expect(result.success).toBe(false);
  });

  // 保存されるのは正規化後の値なので、末尾の空白で上限を超えても弾かない
  it('正規化すると上限に収まる文字列は受け付ける', () => {
    // Arrange
    const input = `${'あ'.repeat(DATE_NOTE_MAX_LENGTH)}    `;

    // Act
    const result = DateNoteSchema.safeParse(input);

    // Assert
    expect(result.success).toBe(true);
  });

  it('null を受け付ける（ひとことのクリア）', () => {
    // Arrange
    const input = null;

    // Act
    const result = DateNoteSchema.safeParse(input);

    // Assert
    expect(result.success).toBe(true);
  });

  it('文字列でも null でもない値を拒否する', () => {
    // Arrange
    const input = 1300;

    // Act
    const result = DateNoteSchema.safeParse(input);

    // Assert
    expect(result.success).toBe(false);
  });

  // parse 境界で正規化まで済ませる（呼び出し側で normalizeDateNote() を呼び忘れても
  // 空白のみの文字列が漏れないようにする）。
  describe('parse すると正規化済みの値になる', () => {
    it('前後の空白を落とした文字列になる', () => {
      // Arrange
      const input = '  13:00〜17:00  ';

      // Act
      const result = DateNoteSchema.parse(input);

      // Assert
      expect(result).toBe('13:00〜17:00');
    });

    it('空白のみの文字列は null になる', () => {
      // Arrange
      const input = '   ';

      // Act
      const result = DateNoteSchema.parse(input);

      // Assert
      expect(result).toBeNull();
    });

    it('null は null のまま', () => {
      // Arrange
      const input = null;

      // Act
      const result = DateNoteSchema.parse(input);

      // Assert
      expect(result).toBeNull();
    });
  });
});
