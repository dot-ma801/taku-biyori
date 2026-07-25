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
  findGameSessionStatus: vi.fn().mockResolvedValue(GameSessionStatus.confirmed),
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

  it('日程未確定（scheduling）でも退出できる', async () => {
    // Arrange
    const repo = makeRepo({
      findGameSessionStatus: vi
        .fn()
        .mockResolvedValue(GameSessionStatus.scheduling),
    });

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

  // 当日参加したユーザーがその日のうちに退出できる必要がある（joinSession と対称）
  it('実施日当日（today）でも退出できる', async () => {
    // Arrange
    const repo = makeRepo({
      findGameSessionStatus: vi.fn().mockResolvedValue(GameSessionStatus.today),
    });

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

  // 退出可能なのは公開済み・実施前（confirmed）／当日（today）／日程未確定（scheduling）（ACTION_POLICIES）
  it.each([
    GameSessionStatus.draft,
    GameSessionStatus.completed,
    GameSessionStatus.cancelled,
  ])('退出できないステータス（%s）は sessionNotOpen を返す', async (status) => {
    // Arrange
    const repo = makeRepo({
      findGameSessionStatus: vi.fn().mockResolvedValue(status),
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
