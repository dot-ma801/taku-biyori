import { describe, expect, it, vi, afterEach } from 'vitest';
import {
  CreateLobbyInputSchema,
  UpdateLobbyInputSchema,
  JoinLobbyInputSchema,
  JoinLobbyAsGuestInputSchema,
} from '@/lobby';

afterEach(() => {
  vi.useRealTimers();
});

describe('CreateLobbyInputSchema', () => {
  it('title と candidateDates があれば成功する', () => {
    // Arrange
    const input = { title: '募集', candidateDates: ['2099-09-01'] };

    // Act
    const result = CreateLobbyInputSchema.safeParse(input);

    // Assert
    expect(result.success).toBe(true);
  });

  it('candidateDates が空配列なら失敗する', () => {
    // Arrange
    const input = { title: '募集', candidateDates: [] };

    // Act
    const result = CreateLobbyInputSchema.safeParse(input);

    // Assert
    expect(result.success).toBe(false);
  });

  describe('candidateDates の重複禁止', () => {
    it('重複する日付を含むと失敗する', () => {
      // Arrange
      const input = {
        title: '募集',
        candidateDates: ['2099-09-01', '2099-09-02', '2099-09-01'],
      };

      // Act
      const result = CreateLobbyInputSchema.safeParse(input);

      // Assert
      expect(result.success).toBe(false);
    });

    it('すべて異なる日付なら成功する', () => {
      // Arrange
      const input = {
        title: '募集',
        candidateDates: ['2099-09-01', '2099-09-02', '2099-09-03'],
      };

      // Act
      const result = CreateLobbyInputSchema.safeParse(input);

      // Assert
      expect(result.success).toBe(true);
    });
  });

  describe('過去日の禁止', () => {
    it('openUntil が過去日なら失敗する', () => {
      // Arrange
      vi.setSystemTime(new Date('2025-06-15T00:00:00'));
      const input = {
        title: '募集',
        openUntil: '2025-06-14',
        candidateDates: ['2099-09-01'],
      };

      // Act
      const result = CreateLobbyInputSchema.safeParse(input);

      // Assert
      expect(result.success).toBe(false);
    });

    it('openUntil が今日以降なら成功する', () => {
      // Arrange
      vi.setSystemTime(new Date('2025-06-15T00:00:00'));
      const input = {
        title: '募集',
        openUntil: '2025-06-15',
        candidateDates: ['2099-09-01'],
      };

      // Act
      const result = CreateLobbyInputSchema.safeParse(input);

      // Assert
      expect(result.success).toBe(true);
    });
  });
});

describe('UpdateLobbyInputSchema', () => {
  it('1 フィールドあれば成功する', () => {
    // Arrange
    const input = { title: '更新後' };

    // Act
    const result = UpdateLobbyInputSchema.safeParse(input);

    // Assert
    expect(result.success).toBe(true);
  });

  it('空オブジェクトなら失敗する', () => {
    // Arrange
    const input = {};

    // Act
    const result = UpdateLobbyInputSchema.safeParse(input);

    // Assert
    expect(result.success).toBe(false);
  });

  describe('openUntil の過去日禁止', () => {
    it('openUntil が過去日なら失敗する', () => {
      // Arrange
      vi.setSystemTime(new Date('2025-06-15T00:00:00'));
      const input = { openUntil: '2025-06-14' };

      // Act
      const result = UpdateLobbyInputSchema.safeParse(input);

      // Assert
      expect(result.success).toBe(false);
    });

    it('openUntil が今日以降なら成功する', () => {
      // Arrange
      vi.setSystemTime(new Date('2025-06-15T00:00:00'));
      const input = { openUntil: '2025-06-15' };

      // Act
      const result = UpdateLobbyInputSchema.safeParse(input);

      // Assert
      expect(result.success).toBe(true);
    });

    it('openUntil が null（クリア）なら成功する', () => {
      // Arrange
      vi.setSystemTime(new Date('2025-06-15T00:00:00'));
      const input = { openUntil: null };

      // Act
      const result = UpdateLobbyInputSchema.safeParse(input);

      // Assert
      expect(result.success).toBe(true);
    });

    it('openUntil 未指定（他フィールドのみ）なら成功する', () => {
      // Arrange
      vi.setSystemTime(new Date('2025-06-15T00:00:00'));
      const input = { title: '更新後' };

      // Act
      const result = UpdateLobbyInputSchema.safeParse(input);

      // Assert
      expect(result.success).toBe(true);
    });
  });
});

describe('JoinLobbyInputSchema', () => {
  it('空オブジェクトで成功する（募集枠メンバーは character_name を持たない）', () => {
    // Arrange
    const input = {};

    // Act
    const result = JoinLobbyInputSchema.safeParse(input);

    // Assert
    expect(result.success).toBe(true);
  });
});

describe('JoinLobbyAsGuestInputSchema', () => {
  it('guestName があれば成功する', () => {
    // Arrange
    const input = { guestName: 'ゲスト太郎' };

    // Act
    const result = JoinLobbyAsGuestInputSchema.safeParse(input);

    // Assert
    expect(result.success).toBe(true);
  });

  it('guestName が空文字なら失敗する', () => {
    // Arrange
    const input = { guestName: '' };

    // Act
    const result = JoinLobbyAsGuestInputSchema.safeParse(input);

    // Assert
    expect(result.success).toBe(false);
  });

  it('guestName が未指定なら失敗する', () => {
    // Arrange
    const input = {};

    // Act
    const result = JoinLobbyAsGuestInputSchema.safeParse(input);

    // Assert
    expect(result.success).toBe(false);
  });

  it('guestName が 100 文字なら成功する', () => {
    // Arrange
    const input = { guestName: 'あ'.repeat(100) };

    // Act
    const result = JoinLobbyAsGuestInputSchema.safeParse(input);

    // Assert
    expect(result.success).toBe(true);
  });

  it('guestName が 101 文字なら失敗する（openapi.yml の 50 文字ではなく実装の 100 文字が正）', () => {
    // Arrange
    const input = { guestName: 'あ'.repeat(101) };

    // Act
    const result = JoinLobbyAsGuestInputSchema.safeParse(input);

    // Assert
    expect(result.success).toBe(false);
  });
});
