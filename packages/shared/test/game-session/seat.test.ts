import { describe, expect, it } from 'vitest';
import {
  CreateSeatInputSchema,
  SeatSchema,
  SeatRefSchema,
  UpdateSeatInputSchema,
  isGuestSeat,
} from '@/game-session/seat';

const SEAT_ID = '33333333-3333-4333-8333-333333333333';
const ENTRY_ID = '44444444-4444-4444-8444-444444444444';

const loginSeat = {
  id: SEAT_ID,
  entryId: ENTRY_ID,
  userId: 'user-1',
  userName: 'たくみ',
  guestName: null,
  characterName: 'アルベルト',
  seatedAt: '2026-08-30T10:00:00.000Z',
};

describe('SeatSchema', () => {
  it('ログインユーザーの着席を受け付ける', () => {
    // Arrange / Act
    const result = SeatSchema.safeParse(loginSeat);

    // Assert
    expect(result.success).toBe(true);
  });

  it('ゲストの着席（userId が null・guestName が非 null）を受け付ける', () => {
    // Arrange
    const seat = {
      ...loginSeat,
      userId: null,
      userName: null,
      guestName: 'ゲストA',
    };

    // Act
    const result = SeatSchema.safeParse(seat);

    // Assert
    expect(result.success).toBe(true);
  });

  it('キャラクター名が未割り当て（null）でも通る', () => {
    // Arrange
    const seat = { ...loginSeat, characterName: null };

    // Act
    const result = SeatSchema.safeParse(seat);

    // Assert
    expect(result.success).toBe(true);
  });

  it('entryId が無いと弾く（表示名の出所であり Seat の唯一の紐付け）', () => {
    // Arrange
    const { entryId: _entryId, ...seat } = loginSeat;

    // Act
    const result = SeatSchema.safeParse(seat);

    // Assert
    expect(result.success).toBe(false);
  });

  it('廃止した lobbyMemberId は通しても結果に残らない', () => {
    // Arrange
    const seat = { ...loginSeat, lobbyMemberId: ENTRY_ID };

    // Act
    const result = SeatSchema.parse(seat);

    // Assert
    expect('lobbyMemberId' in result).toBe(false);
  });
});

describe('SeatRefSchema', () => {
  it('id と userId だけを持つ（一覧の文脈で表示名は載せない）', () => {
    // Arrange
    const ref = { id: SEAT_ID, userId: 'user-1' };

    // Act
    const result = SeatRefSchema.parse(ref);

    // Assert
    expect(result).toEqual({ id: SEAT_ID, userId: 'user-1' });
  });

  it('ゲストの着席は userId が null になる', () => {
    // Arrange
    const ref = { id: SEAT_ID, userId: null };

    // Act
    const result = SeatRefSchema.safeParse(ref);

    // Assert
    expect(result.success).toBe(true);
  });
});

describe('isGuestSeat', () => {
  it('userId が null ならゲストと判定する', () => {
    // Arrange / Act
    const result = isGuestSeat({ userId: null });

    // Assert
    expect(result).toBe(true);
  });

  it('userId があればゲストではない', () => {
    // Arrange / Act
    const result = isGuestSeat({ userId: 'user-1' });

    // Assert
    expect(result).toBe(false);
  });
});

describe('CreateSeatInputSchema', () => {
  it('entryId は必須（着席させられるのはホストだけで、対象は既存の LobbyEntry）', () => {
    // Arrange / Act
    const result = CreateSeatInputSchema.safeParse({ entryId: ENTRY_ID });

    // Assert
    expect(result.success).toBe(true);
  });

  it('body なし（自分で着席）は受け付けない（design-v2 §6-6）', () => {
    // Arrange / Act
    const result = CreateSeatInputSchema.safeParse({});

    // Assert
    expect(result.success).toBe(false);
  });

  it('ゲスト名は受け取らない（代理の新規参加登録は持たない）', () => {
    // Arrange / Act
    const result = CreateSeatInputSchema.safeParse({ guestName: 'ゲストA' });

    // Assert
    expect(result.success).toBe(false);
  });
});

describe('UpdateSeatInputSchema', () => {
  it('キャラクター名を割り当てる', () => {
    // Arrange / Act
    const result = UpdateSeatInputSchema.safeParse({
      characterName: 'アルベルト',
    });

    // Assert
    expect(result.success).toBe(true);
  });

  it('null で割り当てを解除する', () => {
    // Arrange / Act
    const result = UpdateSeatInputSchema.safeParse({ characterName: null });

    // Assert
    expect(result.success).toBe(true);
  });

  it('キーの省略は許さない（「変更しない」と「解除」を区別させないため必須）', () => {
    // Arrange / Act
    const result = UpdateSeatInputSchema.safeParse({});

    // Assert
    expect(result.success).toBe(false);
  });

  it('空文字は弾く（解除の意図は null で表す）', () => {
    // Arrange / Act
    const result = UpdateSeatInputSchema.safeParse({ characterName: '' });

    // Assert
    expect(result.success).toBe(false);
  });

  it('100文字を超えると弾く', () => {
    // Arrange / Act
    const result = UpdateSeatInputSchema.safeParse({
      characterName: 'あ'.repeat(101),
    });

    // Assert
    expect(result.success).toBe(false);
  });
});
