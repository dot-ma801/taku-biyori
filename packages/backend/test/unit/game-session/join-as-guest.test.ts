import { describe, expect, it, vi } from 'vitest';
import { joinAsGuest } from '@/game-session/application/join-as-guest';
import type { JoinAsGuestRepository } from '@/game-session/application/join-as-guest';
import { GameSessionStatus } from '@taku-biyori/shared';
import type { GameSessionMember } from '@taku-biyori/shared';

const TOKEN = 'guest-token-abc';

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
  findGameSessionStatus: vi.fn().mockResolvedValue(GameSessionStatus.confirmed),
  findGuestLinkToken: vi.fn().mockResolvedValue(TOKEN),
  addGuestMember: vi.fn().mockResolvedValue(mockMember),
  ...overrides,
});

describe('joinAsGuest', () => {
  it('open かつトークン一致でゲストが参加できる', async () => {
    // Arrange
    const repo = makeRepo();

    // Act
    const result = await joinAsGuest(repo, 'session-1', TOKEN, {
      guestName: 'ゲスト太郎',
    });

    // Assert
    expect(result).toEqual({ type: 'ok', member: mockMember });
  });

  it('存在しないセッションIDは notFound を返す', async () => {
    // Arrange
    const repo = makeRepo({
      findGameSessionStatus: vi.fn().mockResolvedValue(null),
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
    const result = await joinAsGuest(repo, 'session-1', 'wrong-token', {
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
    const result = await joinAsGuest(repo, 'session-1', TOKEN, {
      guestName: 'ゲスト太郎',
    });

    // Assert
    expect(result).toEqual({ type: 'invalidToken' });
  });

  // 参加条件は「公開済み・未完了・実施日当日まで」= confirmed / today（design-v1.1 §8）
  it('status が today でもゲスト参加できる', async () => {
    // Arrange
    const repo = makeRepo({
      findGameSessionStatus: vi.fn().mockResolvedValue(GameSessionStatus.today),
    });

    // Act
    const result = await joinAsGuest(repo, 'session-1', TOKEN, {
      guestName: 'ゲスト太郎',
    });

    // Assert
    expect(result).toEqual({ type: 'ok', member: mockMember });
  });

  it.each([
    GameSessionStatus.draft,
    GameSessionStatus.scheduling,
    GameSessionStatus.completed,
    GameSessionStatus.cancelled,
  ])(
    'status が %s（参加不可）の場合は sessionNotOpen を返す',
    async (status) => {
      // Arrange
      const repo = makeRepo({
        findGameSessionStatus: vi.fn().mockResolvedValue(status),
      });

      // Act
      const result = await joinAsGuest(repo, 'session-1', TOKEN, {
        guestName: 'ゲスト太郎',
      });

      // Assert
      expect(result).toEqual({ type: 'sessionNotOpen' });
    },
  );

  it('addGuestMember に gameSessionId と input を渡す', async () => {
    // Arrange
    const addGuestMember = vi.fn().mockResolvedValue(mockMember);
    const repo = makeRepo({ addGuestMember });

    // Act
    await joinAsGuest(repo, 'session-1', TOKEN, {
      guestName: 'ゲスト太郎',
    });

    // Assert
    expect(addGuestMember).toHaveBeenCalledWith('session-1', {
      guestName: 'ゲスト太郎',
    });
  });
});
