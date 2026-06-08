import { describe, expect, it, vi } from 'vitest';
import { joinAsGuest } from '@/game-session/application/join-as-guest';
import type { JoinAsGuestRepository } from '@/game-session/application/join-as-guest';
import type { GameSessionMember } from '@taku-biyori/shared';

const mockMember: GameSessionMember = {
  id: 'member-3',
  userId: null,
  userName: null,
  guestName: 'ゲスト太郎',
  characterName: null,
  joinedAt: '2025-01-01T00:00:00.000Z',
};

const makeRepo = (
  overrides: Partial<JoinAsGuestRepository> = {},
): JoinAsGuestRepository => ({
  gameSessionExists: vi.fn().mockResolvedValue(true),
  addGuestMember: vi.fn().mockResolvedValue(mockMember),
  ...overrides,
});

describe('joinAsGuest', () => {
  it('ゲストがセッションに参加できる', async () => {
    // Arrange
    const repo = makeRepo();

    // Act
    const result = await joinAsGuest(repo, 'session-1', {
      guestName: 'ゲスト太郎',
    });

    // Assert
    expect(result).toEqual({ type: 'ok', member: mockMember });
  });

  it('存在しないセッションIDは notFound を返す', async () => {
    // Arrange
    const repo = makeRepo({
      gameSessionExists: vi.fn().mockResolvedValue(false),
    });

    // Act
    const result = await joinAsGuest(repo, 'nonexistent', {
      guestName: 'ゲスト太郎',
    });

    // Assert
    expect(result).toEqual({ type: 'notFound' });
  });

  it('addGuestMember に gameSessionId と input を渡す', async () => {
    // Arrange
    const addGuestMember = vi.fn().mockResolvedValue(mockMember);
    const repo = makeRepo({ addGuestMember });

    // Act
    await joinAsGuest(repo, 'session-1', {
      guestName: 'ゲスト太郎',
      characterName: '被害者',
    });

    // Assert
    expect(addGuestMember).toHaveBeenCalledWith('session-1', {
      guestName: 'ゲスト太郎',
      characterName: '被害者',
    });
  });
});
