import { describe, expect, it, vi } from 'vitest';
import { joinAsGuest } from '@/lobby/application/join-as-guest';
import type { JoinAsGuestRepository } from '@/lobby/application/join-as-guest';
import { LobbyStatus } from '@taku-biyori/shared';
import type { LobbyEntry } from '@taku-biyori/shared';

const TOKEN = 'guest-token-abc';

const mockMember: LobbyEntry = {
  id: 'member-3',
  userId: null,
  userName: null,
  guestName: 'ゲスト太郎',
  joinedAt: '2025-01-01T00:00:00.000Z',
  leftAt: null,
};

const makeRepo = (
  overrides: Partial<JoinAsGuestRepository> = {},
): JoinAsGuestRepository => ({
  findLobbyStatus: vi.fn().mockResolvedValue(LobbyStatus.open),
  findGuestLinkToken: vi.fn().mockResolvedValue(TOKEN),
  addGuestEntry: vi.fn().mockResolvedValue(mockMember),
  ...overrides,
});

describe('joinAsGuest', () => {
  it('open かつトークン一致でゲストが参加できる', async () => {
    // Arrange
    const repo = makeRepo();

    // Act
    const result = await joinAsGuest(repo, 'lobby-1', TOKEN, {
      guestName: 'ゲスト太郎',
    });

    // Assert
    expect(result).toEqual({ type: 'ok', entry: mockMember });
  });

  it('存在しないロビーIDは notFound を返す', async () => {
    // Arrange
    const repo = makeRepo({
      findLobbyStatus: vi.fn().mockResolvedValue(null),
    });

    // Act
    const result = await joinAsGuest(repo, 'nonexistent', TOKEN, {
      guestName: 'ゲスト太郎',
    });

    // Assert
    expect(result).toEqual({ type: 'notFound' });
  });

  it('トークンが一致しない場合は invalidToken を返す', async () => {
    // Arrange
    const repo = makeRepo({
      findGuestLinkToken: vi.fn().mockResolvedValue(TOKEN),
    });

    // Act
    const result = await joinAsGuest(repo, 'lobby-1', 'wrong-token', {
      guestName: 'ゲスト太郎',
    });

    // Assert
    expect(result).toEqual({ type: 'invalidToken' });
  });

  it('トークンが存在しない（null）場合も invalidToken を返す', async () => {
    // Arrange
    const repo = makeRepo({
      findGuestLinkToken: vi.fn().mockResolvedValue(null),
    });

    // Act
    const result = await joinAsGuest(repo, 'lobby-1', TOKEN, {
      guestName: 'ゲスト太郎',
    });

    // Assert
    expect(result).toEqual({ type: 'invalidToken' });
  });

  it.each([LobbyStatus.draft, LobbyStatus.closed, LobbyStatus.disbanded])(
    'status が %s（open でない）場合は lobbyNotOpen を返す',
    async (status) => {
      // Arrange
      const repo = makeRepo({
        findLobbyStatus: vi.fn().mockResolvedValue(status),
      });

      // Act
      const result = await joinAsGuest(repo, 'lobby-1', TOKEN, {
        guestName: 'ゲスト太郎',
      });

      // Assert
      expect(result).toEqual({ type: 'lobbyNotOpen' });
    },
  );

  it('重複するゲスト参加も許容する（dedup しない）', async () => {
    // Arrange
    const addGuestEntry = vi.fn().mockResolvedValue(mockMember);
    const repo = makeRepo({ addGuestEntry });

    // Act
    await joinAsGuest(repo, 'lobby-1', TOKEN, { guestName: 'ゲスト太郎' });
    await joinAsGuest(repo, 'lobby-1', TOKEN, { guestName: 'ゲスト太郎' });

    // Assert
    expect(addGuestEntry).toHaveBeenCalledTimes(2);
  });

  it('addGuestEntry に lobbyId と input を渡す', async () => {
    // Arrange
    const addGuestEntry = vi.fn().mockResolvedValue(mockMember);
    const repo = makeRepo({ addGuestEntry });

    // Act
    await joinAsGuest(repo, 'lobby-1', TOKEN, {
      guestName: 'ゲスト太郎',
    });

    // Assert
    expect(addGuestEntry).toHaveBeenCalledWith('lobby-1', {
      guestName: 'ゲスト太郎',
    });
  });
});
