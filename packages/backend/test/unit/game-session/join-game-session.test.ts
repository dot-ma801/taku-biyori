import { describe, expect, it, vi } from 'vitest';
import { joinGameSession } from '@/game-session/application/join-game-session';
import type { JoinGameSessionRepository } from '@/game-session/application/join-game-session';
import type { GameSessionMember } from '@taku-biyori/shared';
import { GameSessionStatus } from '@taku-biyori/shared';

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
  findGameSessionStatus: vi.fn().mockResolvedValue(GameSessionStatus.confirmed),
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
      findGameSessionStatus: vi.fn().mockResolvedValue(null),
    });

    // Act
    const result = await joinGameSession(repo, 'nonexistent', 'user-2', {});

    // Assert
    expect(result).toEqual({ type: 'notFound' });
  });

  // 参加条件は「公開済み・未完了・実施日当日まで」= confirmed / today（design-v1.1 §8）
  it('当日（today）のセッションにも参加できる', async () => {
    // Arrange
    const repo = makeRepo({
      findGameSessionStatus: vi.fn().mockResolvedValue(GameSessionStatus.today),
    });

    // Act
    const result = await joinGameSession(repo, 'session-1', 'user-2', {});

    // Assert
    expect(result).toEqual({ type: 'ok', member: mockMember });
  });

  it.each([
    GameSessionStatus.draft,
    GameSessionStatus.scheduling,
    GameSessionStatus.completed,
    GameSessionStatus.cancelled,
  ])('参加できないステータス（%s）は sessionNotOpen を返す', async (status) => {
    // Arrange
    const repo = makeRepo({
      findGameSessionStatus: vi.fn().mockResolvedValue(status),
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
