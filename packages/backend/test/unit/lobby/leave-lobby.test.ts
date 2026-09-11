import { describe, expect, it, vi } from 'vitest';
import { leaveLobby } from '@/lobby/application/leave-lobby';
import type { LeaveLobbyRepository } from '@/lobby/application/leave-lobby';
import { LobbyStatus } from '@taku-biyori/shared';

const makeRepo = (
  overrides: Partial<LeaveLobbyRepository> = {},
): LeaveLobbyRepository => ({
  findEntryOwner: vi
    .fn()
    .mockResolvedValue({ lobbyId: 'lobby-1', userId: 'user-2', leftAt: null }),
  findHostUserId: vi.fn().mockResolvedValue('user-1'),
  findLobbyStatus: vi.fn().mockResolvedValue(LobbyStatus.open),
  markEntryLeft: vi.fn().mockResolvedValue(undefined),
  ...overrides,
});

describe('leaveLobby', () => {
  it('本人がロビーから脱退できる（open）', async () => {
    // Arrange
    const repo = makeRepo();

    // Act
    const result = await leaveLobby(repo, 'lobby-1', 'member-1', 'user-2');

    // Assert
    expect(result).toEqual({ type: 'ok' });
  });

  it('本人がロビーから脱退できる（closed）', async () => {
    // Arrange
    const repo = makeRepo({
      findLobbyStatus: vi.fn().mockResolvedValue(LobbyStatus.closed),
    });

    // Act
    const result = await leaveLobby(repo, 'lobby-1', 'member-1', 'user-2');

    // Assert
    expect(result).toEqual({ type: 'ok' });
  });

  it('ホストが他の参加者（ゲスト含む）を脱退させられる', async () => {
    // Arrange
    const repo = makeRepo();

    // Act
    const result = await leaveLobby(repo, 'lobby-1', 'member-1', 'user-1');

    // Assert
    expect(result).toEqual({ type: 'ok' });
  });

  it('ホスト自身は脱退できない', async () => {
    // Arrange
    const repo = makeRepo({
      findEntryOwner: vi.fn().mockResolvedValue({
        lobbyId: 'lobby-1',
        userId: 'user-1',
        leftAt: null,
      }),
    });

    // Act
    const result = await leaveLobby(repo, 'lobby-1', 'member-host', 'user-1');

    // Assert
    expect(result).toEqual({ type: 'hostCannotLeave' });
  });

  it('存在しないメンバーIDは notFound を返す', async () => {
    // Arrange
    const repo = makeRepo({ findEntryOwner: vi.fn().mockResolvedValue(null) });

    // Act
    const result = await leaveLobby(repo, 'lobby-1', 'nonexistent', 'user-2');

    // Assert
    expect(result).toEqual({ type: 'notFound' });
  });

  it('他ロビーのメンバーIDは notFound を返す', async () => {
    // Arrange
    const repo = makeRepo({
      findEntryOwner: vi.fn().mockResolvedValue({
        lobbyId: 'other-lobby',
        userId: 'user-2',
        leftAt: null,
      }),
    });

    // Act
    const result = await leaveLobby(repo, 'lobby-1', 'member-1', 'user-2');

    // Assert
    expect(result).toEqual({ type: 'notFound' });
  });

  it.each([LobbyStatus.disbanded])(
    'status が %s のロビーは invalidStatus を返す',
    async (status) => {
      // Arrange
      const repo = makeRepo({
        findLobbyStatus: vi.fn().mockResolvedValue(status),
      });

      // Act
      const result = await leaveLobby(repo, 'lobby-1', 'member-1', 'user-2');

      // Assert
      expect(result).toEqual({ type: 'invalidStatus' });
    },
  );

  it('status が draft のロビーでも脱退できる（disbanded 以外は可。design-v2 §4-3）', async () => {
    // Arrange
    const repo = makeRepo({
      findLobbyStatus: vi.fn().mockResolvedValue(LobbyStatus.draft),
    });

    // Act
    const result = await leaveLobby(repo, 'lobby-1', 'member-1', 'user-2');

    // Assert
    expect(result).toEqual({ type: 'ok' });
  });

  it('脱退は行を消さず left_at をセットする（markEntryLeft を呼ぶ）', async () => {
    // Arrange
    const markEntryLeft = vi.fn().mockResolvedValue(undefined);
    const repo = makeRepo({ markEntryLeft });

    // Act
    await leaveLobby(repo, 'lobby-1', 'member-1', 'user-2');

    // Assert
    expect(markEntryLeft).toHaveBeenCalledWith('member-1');
  });

  it('すでに脱退済みの行は notFound を返す（left_at を上書きしない）', async () => {
    // Arrange
    const markEntryLeft = vi.fn();
    const repo = makeRepo({
      findEntryOwner: vi.fn().mockResolvedValue({
        lobbyId: 'lobby-1',
        userId: 'user-2',
        leftAt: new Date('2026-08-10T00:00:00.000Z'),
      }),
      markEntryLeft,
    });

    // Act
    const result = await leaveLobby(repo, 'lobby-1', 'member-1', 'user-2');

    // Assert
    expect(result).toEqual({ type: 'notFound' });
    expect(markEntryLeft).not.toHaveBeenCalled();
  });

  it('本人でもホストでもないユーザーは forbidden を返す', async () => {
    // Arrange
    const repo = makeRepo();

    // Act
    const result = await leaveLobby(repo, 'lobby-1', 'member-1', 'user-3');

    // Assert
    expect(result).toEqual({ type: 'forbidden' });
  });
});
