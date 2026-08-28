import { describe, expect, it, vi } from 'vitest';
import { joinAsGuest } from '@/lobby/application/join-as-guest';
import type { JoinAsGuestRepository } from '@/lobby/application/join-as-guest';
import { LobbyStatus } from '@taku-biyori/shared';
import type { LobbyMember } from '@taku-biyori/shared';

const TOKEN = 'guest-token-abc';

const mockMember: LobbyMember = {
  id: 'member-3',
  userId: null,
  userName: null,
  guestName: 'ゲスト太郎',
  joinedAt: '2025-01-01T00:00:00.000Z',
};

const makeRepo = (
  overrides: Partial<JoinAsGuestRepository> = {},
): JoinAsGuestRepository => ({
  findLobbyStatus: vi.fn().mockResolvedValue(LobbyStatus.open),
  findGuestLinkToken: vi.fn().mockResolvedValue(TOKEN),
  addGuestMember: vi.fn().mockResolvedValue(mockMember),
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
    expect(result).toEqual({ type: 'ok', member: mockMember });
  });

  it('存在しない募集枠IDは notFound を返す', async () => {
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

  it.each([LobbyStatus.draft, LobbyStatus.scheduling, LobbyStatus.cancelled])(
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
    const addGuestMember = vi.fn().mockResolvedValue(mockMember);
    const repo = makeRepo({ addGuestMember });

    // Act
    await joinAsGuest(repo, 'lobby-1', TOKEN, { guestName: 'ゲスト太郎' });
    await joinAsGuest(repo, 'lobby-1', TOKEN, { guestName: 'ゲスト太郎' });

    // Assert
    expect(addGuestMember).toHaveBeenCalledTimes(2);
  });

  it('addGuestMember に lobbyId と input を渡す', async () => {
    // Arrange
    const addGuestMember = vi.fn().mockResolvedValue(mockMember);
    const repo = makeRepo({ addGuestMember });

    // Act
    await joinAsGuest(repo, 'lobby-1', TOKEN, {
      guestName: 'ゲスト太郎',
    });

    // Assert
    expect(addGuestMember).toHaveBeenCalledWith('lobby-1', {
      guestName: 'ゲスト太郎',
    });
  });
});
