import { describe, expect, it, vi } from 'vitest';
import { joinGameSession } from '@/game-session/application/join-game-session';
import type { JoinGameSessionRepository } from '@/game-session/application/join-game-session';
import type { GameSessionMember } from '@taku-biyori/shared';

const mockMember: GameSessionMember = {
  id: 'member-2',
  userId: 'user-2',
  userName: '新規ユーザー',
  guestName: null,
  characterName: null,
  joinedAt: '2025-01-01T00:00:00.000Z',
};

const makeRepo = (
  overrides: Partial<JoinGameSessionRepository> = {},
): JoinGameSessionRepository => ({
  gameSessionExists: vi.fn().mockResolvedValue(true),
  findGameSessionStatus: vi.fn().mockResolvedValue('open'),
  findMemberByUserId: vi.fn().mockResolvedValue(null),
  addMember: vi.fn().mockResolvedValue(mockMember),
  ...overrides,
});

describe('joinGameSession', () => {
  it('ユーザーがセッションに参加できる', async () => {
    // Arrange
    const repo = makeRepo();

    // Act
    const result = await joinGameSession(repo, 'session-1', 'user-2', {});

    // Assert
    expect(result).toEqual({ type: 'ok', member: mockMember });
  });

  it('存在しないセッションIDは notFound を返す', async () => {
    // Arrange
    const repo = makeRepo({
      gameSessionExists: vi.fn().mockResolvedValue(false),
    });

    // Act
    const result = await joinGameSession(repo, 'nonexistent', 'user-2', {});

    // Assert
    expect(result).toEqual({ type: 'notFound' });
  });

  it('open 以外のステータスのセッションは sessionNotOpen を返す', async () => {
    // Arrange
    const repo = makeRepo({
      findGameSessionStatus: vi.fn().mockResolvedValue('confirmed'),
    });

    // Act
    const result = await joinGameSession(repo, 'session-1', 'user-2', {});

    // Assert
    expect(result).toEqual({ type: 'sessionNotOpen' });
  });

  it('すでに参加済みのユーザーは alreadyJoined を返す', async () => {
    // Arrange
    const repo = makeRepo({
      findMemberByUserId: vi.fn().mockResolvedValue('member-2'),
    });

    // Act
    const result = await joinGameSession(repo, 'session-1', 'user-2', {});

    // Assert
    expect(result).toEqual({ type: 'alreadyJoined' });
  });

  it('addMember に gameSessionId・userId・input を渡す', async () => {
    // Arrange
    const addMember = vi.fn().mockResolvedValue(mockMember);
    const repo = makeRepo({ addMember });

    // Act
    await joinGameSession(repo, 'session-1', 'user-2', {
      characterName: '探偵',
    });

    // Assert
    expect(addMember).toHaveBeenCalledWith('session-1', 'user-2', {
      characterName: '探偵',
    });
  });
});
