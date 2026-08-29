import { describe, expect, it, vi, afterEach } from 'vitest';
import {
  CreateLobbyInputSchema,
  UpdateLobbyInputSchema,
  JoinLobbyInputSchema,
  JoinLobbyAsGuestInputSchema,
  CreateLobbyAvailabilityDateInputSchema,
  BulkUpdateLobbyAvailabilityDatesInputSchema,
} from '@/lobby';
import { DATE_NOTE_MAX_LENGTH } from '@/lobby/date-note';

afterEach(() => {
  vi.useRealTimers();
});

// 件数上限のテスト用に、重複しない未来日を n 件生成する
const makeUniqueDates = (n: number): { date: string }[] =>
  Array.from({ length: n }, (_, i) => {
    const d = new Date(Date.UTC(2099, 0, 1) + i * 86_400_000);
    return { date: d.toISOString().slice(0, 10) };
  });

describe('CreateLobbyInputSchema', () => {
  it('title と candidateDates があれば成功する', () => {
    // Arrange
    const input = { title: '募集', candidateDates: [{ date: '2099-09-01' }] };

    // Act
    const result = CreateLobbyInputSchema.safeParse(input);

    // Assert
    expect(result.success).toBe(true);
  });

  describe('candidateDates の dateNote（ひとこと）', () => {
    it('dateNote を添えても成功する', () => {
      // Arrange
      const input = {
        title: '募集',
        candidateDates: [{ date: '2099-09-01', dateNote: '13:00〜17:00' }],
      };

      // Act
      const result = CreateLobbyInputSchema.safeParse(input);

      // Assert
      expect(result.success).toBe(true);
    });

    it('dateNote が上限を超えると失敗する', () => {
      // Arrange
      const input = {
        title: '募集',
        candidateDates: [
          {
            date: '2099-09-01',
            dateNote: 'あ'.repeat(DATE_NOTE_MAX_LENGTH + 1),
          },
        ],
      };

      // Act
      const result = CreateLobbyInputSchema.safeParse(input);

      // Assert
      expect(result.success).toBe(false);
    });

    it('dateNote が null（未入力）でも成功する', () => {
      // Arrange
      const input = {
        title: '募集',
        candidateDates: [{ date: '2099-09-01', dateNote: null }],
      };

      // Act
      const result = CreateLobbyInputSchema.safeParse(input);

      // Assert
      expect(result.success).toBe(true);
    });
  });

  it('candidateDates が空配列でも成功する（v2 で任意になった）', () => {
    // Arrange
    const input = { title: '募集', candidateDates: [] };

    // Act
    const result = CreateLobbyInputSchema.safeParse(input);

    // Assert
    expect(result.success).toBe(true);
  });

  it('candidateDates 未指定でも成功する（直接卓立ての経路）', () => {
    // Arrange
    const input = { title: '募集' };

    // Act
    const result = CreateLobbyInputSchema.safeParse(input);

    // Assert
    expect(result.success).toBe(true);
  });

  describe('candidateDates の件数上限', () => {
    it('上限ちょうどの件数は成功する', () => {
      // Arrange
      const input = {
        title: '募集',
        candidateDates: makeUniqueDates(100),
      };

      // Act
      const result = CreateLobbyInputSchema.safeParse(input);

      // Assert
      expect(result.success).toBe(true);
    });

    it('上限を超える件数は失敗する', () => {
      // Arrange
      const input = {
        title: '募集',
        candidateDates: makeUniqueDates(101),
      };

      // Act
      const result = CreateLobbyInputSchema.safeParse(input);

      // Assert
      expect(result.success).toBe(false);
    });
  });

  describe('candidateDates の重複禁止', () => {
    it('重複する日付を含むと失敗する', () => {
      // Arrange
      const input = {
        title: '募集',
        candidateDates: [
          { date: '2099-09-01' },
          { date: '2099-09-02' },
          { date: '2099-09-01' },
        ],
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
        candidateDates: [
          { date: '2099-09-01' },
          { date: '2099-09-02' },
          { date: '2099-09-03' },
        ],
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
        candidateDates: [{ date: '2099-09-01' }],
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
        candidateDates: [{ date: '2099-09-01' }],
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

describe('CreateLobbyAvailabilityDateInputSchema', () => {
  it('今日以降の日付なら成功する', () => {
    // Arrange
    vi.setSystemTime(new Date('2025-06-15T00:00:00'));
    const input = { date: '2025-06-15' };

    // Act
    const result = CreateLobbyAvailabilityDateInputSchema.safeParse(input);

    // Assert
    expect(result.success).toBe(true);
  });

  it('過去日なら失敗する', () => {
    // Arrange
    vi.setSystemTime(new Date('2025-06-15T00:00:00'));
    const input = { date: '2025-06-14' };

    // Act
    const result = CreateLobbyAvailabilityDateInputSchema.safeParse(input);

    // Assert
    expect(result.success).toBe(false);
  });

  it('dateNote を添えても成功する', () => {
    // Arrange
    vi.setSystemTime(new Date('2025-06-15T00:00:00'));
    const input = { date: '2025-06-15', dateNote: '夕方から' };

    // Act
    const result = CreateLobbyAvailabilityDateInputSchema.safeParse(input);

    // Assert
    expect(result.success).toBe(true);
  });
});

describe('BulkUpdateLobbyAvailabilityDatesInputSchema', () => {
  it('1 件以上の日付があれば成功する', () => {
    // Arrange
    const input = { dates: [{ date: '2099-09-01' }, { date: '2099-09-02' }] };

    // Act
    const result = BulkUpdateLobbyAvailabilityDatesInputSchema.safeParse(input);

    // Assert
    expect(result.success).toBe(true);
  });

  describe('dates の dateNote（ひとこと）', () => {
    it('dateNote を添えても成功する', () => {
      // Arrange
      const input = {
        dates: [{ date: '2099-09-01', dateNote: '午後から' }],
      };

      // Act
      const result =
        BulkUpdateLobbyAvailabilityDatesInputSchema.safeParse(input);

      // Assert
      expect(result.success).toBe(true);
    });

    it('dateNote が上限を超えると失敗する', () => {
      // Arrange
      const input = {
        dates: [
          {
            date: '2099-09-01',
            dateNote: 'あ'.repeat(DATE_NOTE_MAX_LENGTH + 1),
          },
        ],
      };

      // Act
      const result =
        BulkUpdateLobbyAvailabilityDatesInputSchema.safeParse(input);

      // Assert
      expect(result.success).toBe(false);
    });
  });

  it('dates が空配列なら失敗する（game-session と異なり 1 件以上が必須）', () => {
    // Arrange
    const input = { dates: [] };

    // Act
    const result = BulkUpdateLobbyAvailabilityDatesInputSchema.safeParse(input);

    // Assert
    expect(result.success).toBe(false);
  });

  it('dates が未指定なら失敗する', () => {
    // Arrange
    const input = {};

    // Act
    const result = BulkUpdateLobbyAvailabilityDatesInputSchema.safeParse(input);

    // Assert
    expect(result.success).toBe(false);
  });

  describe('dates の件数上限', () => {
    it('上限ちょうどの件数は成功する', () => {
      // Arrange
      const input = { dates: makeUniqueDates(100) };

      // Act
      const result =
        BulkUpdateLobbyAvailabilityDatesInputSchema.safeParse(input);

      // Assert
      expect(result.success).toBe(true);
    });

    it('上限を超える件数は失敗する', () => {
      // Arrange
      const input = { dates: makeUniqueDates(101) };

      // Act
      const result =
        BulkUpdateLobbyAvailabilityDatesInputSchema.safeParse(input);

      // Assert
      expect(result.success).toBe(false);
    });
  });

  describe('dates の重複禁止', () => {
    it('重複する日付を含むと失敗する', () => {
      // Arrange
      const input = {
        dates: [
          { date: '2099-09-01' },
          { date: '2099-09-02' },
          { date: '2099-09-01' },
        ],
      };

      // Act
      const result =
        BulkUpdateLobbyAvailabilityDatesInputSchema.safeParse(input);

      // Assert
      expect(result.success).toBe(false);
    });

    it('すべて異なる日付なら成功する', () => {
      // Arrange
      const input = {
        dates: [
          { date: '2099-09-01' },
          { date: '2099-09-02' },
          { date: '2099-09-03' },
        ],
      };

      // Act
      const result =
        BulkUpdateLobbyAvailabilityDatesInputSchema.safeParse(input);

      // Assert
      expect(result.success).toBe(true);
    });
  });
});
