import { describe, expect, it, vi } from 'vitest';
import { joinLobby } from '@/lobby/application/join-lobby';
import type { JoinLobbyRepository } from '@/lobby/application/join-lobby';
import type { LobbyMember } from '@taku-biyori/shared';
import { LobbyStatus } from '@taku-biyori/shared';

const mockMember: LobbyMember = {
  id: 'member-2',
  userId: 'user-2',
  userName: '新規ユーザー',
  guestName: null,
  joinedAt: '2025-01-01T00:00:00.000Z',
};

const makeRepo = (
  overrides: Partial<JoinLobbyRepository> = {},
): JoinLobbyRepository => ({
  findLobbyStatus: vi.fn().mockResolvedValue(LobbyStatus.open),
  findMemberByUserId: vi.fn().mockResolvedValue(null),
  addMember: vi.fn().mockResolvedValue(mockMember),
  ...overrides,
});

describe('joinLobby', () => {
  it('ユーザーが募集枠に参加できる', async () => {
    // Arrange
    const repo = makeRepo();

    // Act
    const result = await joinLobby(repo, 'lobby-1', 'user-2', {});

    // Assert
    expect(result).toEqual({ type: 'ok', member: mockMember });
  });

  it('存在しない募集枠IDは notFound を返す', async () => {
    // Arrange
    const repo = makeRepo({
      findLobbyStatus: vi.fn().mockResolvedValue(null),
    });

    // Act
    const result = await joinLobby(repo, 'nonexistent', 'user-2', {});

    // Assert
    expect(result).toEqual({ type: 'notFound' });
  });

  it.each([
    LobbyStatus.draft,
    LobbyStatus.scheduling,
    LobbyStatus.confirmed,
    LobbyStatus.cancelled,
  ])(
    'status が %s（open でない）場合は lobbyNotOpen を返す',
    async (status) => {
      // Arrange
      const repo = makeRepo({
        findLobbyStatus: vi.fn().mockResolvedValue(status),
      });

      // Act
      const result = await joinLobby(repo, 'lobby-1', 'user-2', {});

      // Assert
      expect(result).toEqual({ type: 'lobbyNotOpen' });
    },
  );

  it('すでに参加済みのユーザーは alreadyJoined を返す', async () => {
    // Arrange
    const repo = makeRepo({
      findMemberByUserId: vi.fn().mockResolvedValue('member-2'),
    });

    // Act
    const result = await joinLobby(repo, 'lobby-1', 'user-2', {});

    // Assert
    expect(result).toEqual({ type: 'alreadyJoined' });
  });

  it('DB 一意制約違反（addMember が null）の場合も alreadyJoined を返す', async () => {
    // Arrange
    const repo = makeRepo({ addMember: vi.fn().mockResolvedValue(null) });

    // Act
    const result = await joinLobby(repo, 'lobby-1', 'user-2', {});

    // Assert
    expect(result).toEqual({ type: 'alreadyJoined' });
  });

  it('addMember に lobbyId・userId・input を渡す', async () => {
    // Arrange
    const addMember = vi.fn().mockResolvedValue(mockMember);
    const repo = makeRepo({ addMember });

    // Act
    await joinLobby(repo, 'lobby-1', 'user-2', {});

    // Assert
    expect(addMember).toHaveBeenCalledWith('lobby-1', 'user-2', {});
  });
});
