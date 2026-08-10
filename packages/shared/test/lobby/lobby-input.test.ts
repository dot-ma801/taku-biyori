import { describe, expect, it, vi, afterEach } from 'vitest';
import {
  CreateLobbyInputSchema,
  UpdateLobbyInputSchema,
  JoinLobbyInputSchema,
  JoinLobbyAsGuestInputSchema,
  CreateLobbyAvailabilityDateInputSchema,
  BulkUpdateLobbyAvailabilityDatesInputSchema,
} from '@/lobby';
import { TIME_NOTE_MAX_LENGTH } from '@/time-note';

afterEach(() => {
  vi.useRealTimers();
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

describe('候補日の timeNote（時刻メモ）', () => {
  it('timeNote を指定できる', () => {
    // Arrange
    const input = {
      title: '募集',
      candidateDates: [{ date: '2099-09-01', timeNote: '午後から' }],
    };

    // Act
    const result = CreateLobbyInputSchema.safeParse(input);

    // Assert
    expect(result.success).toBe(true);
    expect(result.data?.candidateDates[0]?.timeNote).toBe('午後から');
  });

  it('timeNote を省略できる（任意項目）', () => {
    // Arrange
    const input = { title: '募集', candidateDates: [{ date: '2099-09-01' }] };

    // Act
    const result = CreateLobbyInputSchema.safeParse(input);

    // Assert
    expect(result.success).toBe(true);
    expect(result.data?.candidateDates[0]?.timeNote).toBeUndefined();
  });

  it('timeNote に null を指定できる（クリア）', () => {
    // Arrange
    const input = {
      title: '募集',
      candidateDates: [{ date: '2099-09-01', timeNote: null }],
    };

    // Act
    const result = CreateLobbyInputSchema.safeParse(input);

    // Assert
    expect(result.success).toBe(true);
    expect(result.data?.candidateDates[0]?.timeNote).toBeNull();
  });

  it('空文字の timeNote は null に正規化される（DB に空文字を残さない）', () => {
    // Arrange
    const input = {
      title: '募集',
      candidateDates: [{ date: '2099-09-01', timeNote: '' }],
    };

    // Act
    const result = CreateLobbyInputSchema.safeParse(input);

    // Assert
    expect(result.success).toBe(true);
    expect(result.data?.candidateDates[0]?.timeNote).toBeNull();
  });

  it('前後の空白は trim され、空白のみなら null になる', () => {
    // Arrange
    const input = {
      title: '募集',
      candidateDates: [
        { date: '2099-09-01', timeNote: '  夕方から  ' },
        { date: '2099-09-02', timeNote: '   ' },
      ],
    };

    // Act
    const result = CreateLobbyInputSchema.safeParse(input);

    // Assert
    expect(result.success).toBe(true);
    expect(result.data?.candidateDates[0]?.timeNote).toBe('夕方から');
    expect(result.data?.candidateDates[1]?.timeNote).toBeNull();
  });

  it(`timeNote が ${TIME_NOTE_MAX_LENGTH} 文字なら成功する`, () => {
    // Arrange
    const input = {
      title: '募集',
      candidateDates: [
        { date: '2099-09-01', timeNote: 'あ'.repeat(TIME_NOTE_MAX_LENGTH) },
      ],
    };

    // Act
    const result = CreateLobbyInputSchema.safeParse(input);

    // Assert
    expect(result.success).toBe(true);
  });

  it(`timeNote が ${TIME_NOTE_MAX_LENGTH + 1} 文字なら失敗する`, () => {
    // Arrange
    const input = {
      title: '募集',
      candidateDates: [
        {
          date: '2099-09-01',
          timeNote: 'あ'.repeat(TIME_NOTE_MAX_LENGTH + 1),
        },
      ],
    };

    // Act
    const result = CreateLobbyInputSchema.safeParse(input);

    // Assert
    expect(result.success).toBe(false);
  });

  it('一括更新でも timeNote を指定できる', () => {
    // Arrange
    const input = {
      dates: [
        { date: '2099-09-01', timeNote: '午後から' },
        { date: '2099-09-02' },
      ],
    };

    // Act
    const result = BulkUpdateLobbyAvailabilityDatesInputSchema.safeParse(input);

    // Assert
    expect(result.success).toBe(true);
    expect(result.data?.dates[0]?.timeNote).toBe('午後から');
  });

  it('候補日の個別追加でも timeNote を指定できる', () => {
    // Arrange
    vi.setSystemTime(new Date('2025-06-15T00:00:00'));
    const input = { date: '2025-06-20', timeNote: '19:00〜' };

    // Act
    const result = CreateLobbyAvailabilityDateInputSchema.safeParse(input);

    // Assert
    expect(result.success).toBe(true);
    expect(result.data?.timeNote).toBe('19:00〜');
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
});

describe('BulkUpdateLobbyAvailabilityDatesInputSchema', () => {
  it('1 件以上の日付があれば成功する', () => {
    // Arrange
    const input = {
      dates: [{ date: '2099-09-01' }, { date: '2099-09-02' }],
    };

    // Act
    const result = BulkUpdateLobbyAvailabilityDatesInputSchema.safeParse(input);

    // Assert
    expect(result.success).toBe(true);
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
