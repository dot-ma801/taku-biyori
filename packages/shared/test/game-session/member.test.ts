import { describe, expect, it } from 'vitest';
import { isGuestMember } from '@/game-session/member';

describe('isGuestMember', () => {
  it('userId が null のメンバーはゲストと判定する', () => {
    // Arrange
    const member = { userId: null };

    // Act
    const result = isGuestMember(member);

    // Assert
    expect(result).toBe(true);
  });

  it('userId を持つメンバーはゲストではないと判定する', () => {
    // Arrange
    const member = { userId: 'user-1' };

    // Act
    const result = isGuestMember(member);

    // Assert
    expect(result).toBe(false);
  });
});
