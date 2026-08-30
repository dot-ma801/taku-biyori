import { describe, it, expect } from 'vitest';
import { memberDisplayName, memberBaseName } from '@/utils/memberDisplayName';

type MemberNameSource = {
  userId: string | null;
  userName: string | null;
  guestName: string | null;
};

function makeMember(
  overrides: Partial<MemberNameSource> = {},
): MemberNameSource {
  return {
    userId: 'user-1',
    userName: 'テストユーザー',
    guestName: null,
    ...overrides,
  };
}

describe('memberDisplayName', () => {
  it('ログインユーザーのメンバーは userName をそのまま返す', () => {
    // Arrange
    const member = makeMember();

    // Act
    const result = memberDisplayName(member);

    // Assert
    expect(result).toBe('テストユーザー');
  });

  it('ゲストは guestName の末尾に（ゲスト）を付けて返す', () => {
    // Arrange
    const member = makeMember({
      userId: null,
      userName: null,
      guestName: 'ゲスト太郎',
    });

    // Act
    const result = memberDisplayName(member);

    // Assert
    expect(result).toBe('ゲスト太郎（ゲスト）');
  });

  it('userName も guestName もないメンバーは（未設定）を返す', () => {
    // Arrange
    const member = makeMember({ userName: null, guestName: null });

    // Act
    const result = memberDisplayName(member);

    // Assert
    expect(result).toBe('（未設定）');
  });

  it('名前のないゲストは（未設定）を返す（（ゲスト）は付けない）', () => {
    // Arrange
    const member = makeMember({
      userId: null,
      userName: null,
      guestName: null,
    });

    // Act
    const result = memberDisplayName(member);

    // Assert
    expect(result).toBe('（未設定）');
  });
});

describe('memberBaseName', () => {
  it('ログインユーザーのメンバーは userName を返す', () => {
    // Arrange
    const member = makeMember();

    // Act
    const result = memberBaseName(member);

    // Assert
    expect(result).toBe('テストユーザー');
  });

  it('ゲストは（ゲスト）を付けずに guestName を返す', () => {
    // Arrange
    const member = makeMember({
      userId: null,
      userName: null,
      guestName: 'ゲスト太郎',
    });

    // Act
    const result = memberBaseName(member);

    // Assert
    expect(result).toBe('ゲスト太郎');
  });
});
