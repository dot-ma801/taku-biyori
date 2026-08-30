import { describe, expect, it } from 'vitest';
import {
  CreateGameSessionInputSchema,
  UpdateGameSessionInputSchema,
  UpdateGameSessionStatusInputSchema,
} from '@/game-session';

const ENTRY_ID = '22222222-2222-4222-8222-222222222222';

describe('CreateGameSessionInputSchema', () => {
  it('開催日と着席させる entryIds があれば通る', () => {
    // Arrange
    const input = { scheduledAt: '2026-09-01', entryIds: [ENTRY_ID] };

    // Act
    const result = CreateGameSessionInputSchema.safeParse(input);

    // Assert
    expect(result.success).toBe(true);
  });

  it('上書き項目と当日の連絡事項を同送できる', () => {
    // Arrange
    const input = {
      scheduledAt: '2026-09-01',
      entryIds: [ENTRY_ID],
      title: '第2回',
      scenarioName: '別シナリオ',
      location: 'カフェ〇〇',
      timeLabel: '13:00〜',
      description: '13:50 に VC 集合',
    };

    // Act
    const result = CreateGameSessionInputSchema.safeParse(input);

    // Assert
    expect(result.success).toBe(true);
  });

  it('entryIds が空配列なら弾く（着席者0人のセッションは作らせない）', () => {
    // Arrange
    const input = { scheduledAt: '2026-09-01', entryIds: [] };

    // Act
    const result = CreateGameSessionInputSchema.safeParse(input);

    // Assert
    expect(result.success).toBe(false);
  });

  it('entryIds が無いと弾く', () => {
    // Arrange
    const input = { scheduledAt: '2026-09-01' };

    // Act
    const result = CreateGameSessionInputSchema.safeParse(input);

    // Assert
    expect(result.success).toBe(false);
  });

  it('scheduledAt が日付形式でないと弾く', () => {
    // Arrange
    const input = { scheduledAt: '2026/09/01', entryIds: [ENTRY_ID] };

    // Act
    const result = CreateGameSessionInputSchema.safeParse(input);

    // Assert
    expect(result.success).toBe(false);
  });

  it('候補日 ID は受け取らない（開催日は候補日のコピーではない。design-v2 §5-2）', () => {
    // Arrange
    const input = { candidateId: ENTRY_ID, entryIds: [ENTRY_ID] };

    // Act
    const result = CreateGameSessionInputSchema.safeParse(input);

    // Assert
    expect(result.success).toBe(false);
  });

  it('timeLabel が20文字を超えると弾く', () => {
    // Arrange
    const input = {
      scheduledAt: '2026-09-01',
      entryIds: [ENTRY_ID],
      timeLabel: 'あ'.repeat(21),
    };

    // Act
    const result = CreateGameSessionInputSchema.safeParse(input);

    // Assert
    expect(result.success).toBe(false);
  });
});

describe('UpdateGameSessionInputSchema', () => {
  it('上書き項目に null を渡せる（上書きの解除）', () => {
    // Arrange
    const input = {
      title: null,
      scenarioName: null,
      location: null,
      timeLabel: null,
    };

    // Act
    const result = UpdateGameSessionInputSchema.safeParse(input);

    // Assert
    expect(result.success).toBe(true);
  });

  it('キーを省略した項目は結果に現れない（「変更しない」と「解除」を区別する）', () => {
    // Arrange
    const input = { title: null };

    // Act
    const result = UpdateGameSessionInputSchema.parse(input);

    // Assert
    expect(result).toEqual({ title: null });
    expect('location' in result).toBe(false);
  });

  it('scheduledAt に null は渡せない（セッションは必ず日程を持つ）', () => {
    // Arrange
    const input = { scheduledAt: null };

    // Act
    const result = UpdateGameSessionInputSchema.safeParse(input);

    // Assert
    expect(result.success).toBe(false);
  });

  it('空オブジェクトは弾く', () => {
    // Arrange
    const input = {};

    // Act
    const result = UpdateGameSessionInputSchema.safeParse(input);

    // Assert
    expect(result.success).toBe(false);
  });

  it('募集系の項目（maxMembers）は受け取らない（ロビーの関心事へ移った）', () => {
    // Arrange
    const input = { maxMembers: 6 };

    // Act
    const result = UpdateGameSessionInputSchema.safeParse(input);

    // Assert
    expect(result.success).toBe(false);
  });
});

describe('UpdateGameSessionStatusInputSchema', () => {
  it.each(['completed', 'cancelled'])('%s への遷移を受け付ける', (status) => {
    // Arrange
    const input = { status };

    // Act
    const result = UpdateGameSessionStatusInputSchema.safeParse(input);

    // Assert
    expect(result.success).toBe(true);
  });

  it.each(['open', 'draft', 'scheduled', 'today'])(
    '%s は受け付けない（design-v2 §6-13-6）',
    (status) => {
      // Arrange
      const input = { status };

      // Act
      const result = UpdateGameSessionStatusInputSchema.safeParse(input);

      // Assert
      expect(result.success).toBe(false);
    },
  );
});
