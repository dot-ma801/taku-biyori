import { describe, expect, it, vi } from 'vitest';
import { leaveGameSession } from '@/game-session/application/leave-game-session';
import type { LeaveGameSessionRepository } from '@/game-session/application/leave-game-session';
import { GameSessionStatus } from '@taku-biyori/shared';

const makeRepo = (
  overrides: Partial<LeaveGameSessionRepository> = {},
): LeaveGameSessionRepository => ({
  findMemberOwner: vi
    .fn()
    .mockResolvedValue({ gameSessionId: 'session-1', userId: 'user-2' }),
  findHostUserId: vi.fn().mockResolvedValue('user-1'),
  findGameSessionStatus: vi.fn().mockResolvedValue(GameSessionStatus.open),
  deleteMemberById: vi.fn().mockResolvedValue(undefined),
  ...overrides,
});

describe('leaveGameSession', () => {
  it('本人がセッションから退出できる', async () => {
    // Arrange
    const repo = makeRepo();

    // Act
    const result = await leaveGameSession(
      repo,
      'session-1',
      'member-1',
      'user-2',
    );

    // Assert
    expect(result).toEqual({ type: 'ok' });
  });

  it('ホストが他のメンバーを削除できる', async () => {
    // Arrange
    const repo = makeRepo();

    // Act
    const result = await leaveGameSession(
      repo,
      'session-1',
      'member-1',
      'user-1',
    );

    // Assert
    expect(result).toEqual({ type: 'ok' });
  });

  it('ホスト自身は退出できない', async () => {
    // Arrange
    const repo = makeRepo({
      findMemberOwner: vi
        .fn()
        .mockResolvedValue({ gameSessionId: 'session-1', userId: 'user-1' }),
    });

    // Act
    const result = await leaveGameSession(
      repo,
      'session-1',
      'member-host',
      'user-1',
    );

    // Assert
    expect(result).toEqual({ type: 'hostCannotLeave' });
  });

  it('存在しないメンバーIDは notFound を返す', async () => {
    // Arrange
    const repo = makeRepo({ findMemberOwner: vi.fn().mockResolvedValue(null) });

    // Act
    const result = await leaveGameSession(
      repo,
      'session-1',
      'nonexistent',
      'user-2',
    );

    // Assert
    expect(result).toEqual({ type: 'notFound' });
  });

  it('他セッションのメンバーIDは notFound を返す', async () => {
    // Arrange
    const repo = makeRepo({
      findMemberOwner: vi.fn().mockResolvedValue({
        gameSessionId: 'other-session',
        userId: 'user-2',
      }),
    });

    // Act
    const result = await leaveGameSession(
      repo,
      'session-1',
      'member-1',
      'user-2',
    );

    // Assert
    expect(result).toEqual({ type: 'notFound' });
  });

  it('open 以外のステータスのセッションは sessionNotOpen を返す', async () => {
    // Arrange
    const repo = makeRepo({
      findGameSessionStatus: vi.fn().mockResolvedValue(GameSessionStatus.confirmed),
    });

    // Act
    const result = await leaveGameSession(
      repo,
      'session-1',
      'member-1',
      'user-2',
    );

    // Assert
    expect(result).toEqual({ type: 'sessionNotOpen' });
  });

  it('本人でもホストでもないユーザーは forbidden を返す', async () => {
    // Arrange
    const repo = makeRepo();

    // Act
    const result = await leaveGameSession(
      repo,
      'session-1',
      'member-1',
      'user-3',
    );

    // Assert
    expect(result).toEqual({ type: 'forbidden' });
  });
});
