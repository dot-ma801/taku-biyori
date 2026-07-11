import { describe, expect, it, vi } from 'vitest';
import { leaveLobby } from '@/lobby/application/leave-lobby';
import type { LeaveLobbyRepository } from '@/lobby/application/leave-lobby';
import { LobbyStatus } from '@taku-biyori/shared';

const makeRepo = (
  overrides: Partial<LeaveLobbyRepository> = {},
): LeaveLobbyRepository => ({
  findMemberOwner: vi
    .fn()
    .mockResolvedValue({ lobbyId: 'lobby-1', userId: 'user-2' }),
  findHostUserId: vi.fn().mockResolvedValue('user-1'),
  findLobbyStatus: vi.fn().mockResolvedValue(LobbyStatus.open),
  deleteMemberById: vi.fn().mockResolvedValue(undefined),
  ...overrides,
});

describe('leaveLobby', () => {
  it('本人が募集枠から退出できる（open）', async () => {
    // Arrange
    const repo = makeRepo();

    // Act
    const result = await leaveLobby(repo, 'lobby-1', 'member-1', 'user-2');

    // Assert
    expect(result).toEqual({ type: 'ok' });
  });

  it('本人が募集枠から退出できる（scheduling）', async () => {
    // Arrange
    const repo = makeRepo({
      findLobbyStatus: vi.fn().mockResolvedValue(LobbyStatus.scheduling),
    });

    // Act
    const result = await leaveLobby(repo, 'lobby-1', 'member-1', 'user-2');

    // Assert
    expect(result).toEqual({ type: 'ok' });
  });

  it('ホストが他のメンバー（ゲスト含む）を削除できる', async () => {
    // Arrange
    const repo = makeRepo();

    // Act
    const result = await leaveLobby(repo, 'lobby-1', 'member-1', 'user-1');

    // Assert
    expect(result).toEqual({ type: 'ok' });
  });

  it('ホスト自身は退出できない', async () => {
    // Arrange
    const repo = makeRepo({
      findMemberOwner: vi
        .fn()
        .mockResolvedValue({ lobbyId: 'lobby-1', userId: 'user-1' }),
    });

    // Act
    const result = await leaveLobby(repo, 'lobby-1', 'member-host', 'user-1');

    // Assert
    expect(result).toEqual({ type: 'hostCannotLeave' });
  });

  it('存在しないメンバーIDは notFound を返す', async () => {
    // Arrange
    const repo = makeRepo({ findMemberOwner: vi.fn().mockResolvedValue(null) });

    // Act
    const result = await leaveLobby(repo, 'lobby-1', 'nonexistent', 'user-2');

    // Assert
    expect(result).toEqual({ type: 'notFound' });
  });

  it('他募集枠のメンバーIDは notFound を返す', async () => {
    // Arrange
    const repo = makeRepo({
      findMemberOwner: vi
        .fn()
        .mockResolvedValue({ lobbyId: 'other-lobby', userId: 'user-2' }),
    });

    // Act
    const result = await leaveLobby(repo, 'lobby-1', 'member-1', 'user-2');

    // Assert
    expect(result).toEqual({ type: 'notFound' });
  });

  it.each([LobbyStatus.confirmed, LobbyStatus.cancelled])(
    'status が %s の募集枠は invalidStatus を返す',
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

  it('status が draft の募集枠は invalidStatus を返す', async () => {
    // Arrange
    const repo = makeRepo({
      findLobbyStatus: vi.fn().mockResolvedValue(LobbyStatus.draft),
    });

    // Act
    const result = await leaveLobby(repo, 'lobby-1', 'member-1', 'user-2');

    // Assert
    expect(result).toEqual({ type: 'invalidStatus' });
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
