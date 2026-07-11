import { describe, expect, it, vi } from 'vitest';
import { createLobby } from '@/lobby/application/create-lobby';
import type { CreateLobbyRepository } from '@/lobby/application/create-lobby';
import type { Lobby } from '@taku-biyori/shared';

const mockLobby: Lobby = {
  id: 'lobby-1',
  title: 'テスト募集',
  scenarioName: null,
  description: null,
  location: null,
  maxPlayers: null,
  status: 'draft',
  isPublished: false,
  openUntil: null,
  closedAt: null,
  cancelledAt: null,
  hostUserId: 'user-1',
  createdAt: '2025-01-01T00:00:00.000Z',
  updatedAt: '2025-01-01T00:00:00.000Z',
};

describe('createLobby', () => {
  it('ユースケースが Lobby を返す', async () => {
    // Arrange
    const repo: CreateLobbyRepository = {
      createWithHostAndCandidates: vi.fn().mockResolvedValue(mockLobby),
    };

    // Act
    const result = await createLobby(repo, 'user-1', {
      title: 'テスト募集',
      candidateDates: ['2099-09-01'],
    });

    // Assert
    expect(result).toMatchObject({
      id: 'lobby-1',
      title: 'テスト募集',
      status: 'draft',
      isPublished: false,
      hostUserId: 'user-1',
    });
  });

  it('createWithHostAndCandidates に hostUserId・title・candidateDates を渡す', async () => {
    // Arrange
    const createWithHostAndCandidates = vi.fn().mockResolvedValue(mockLobby);
    const repo: CreateLobbyRepository = { createWithHostAndCandidates };

    // Act
    await createLobby(repo, 'user-99', {
      title: 'マイ募集',
      candidateDates: ['2099-09-01', '2099-09-02'],
    });

    // Assert
    expect(createWithHostAndCandidates).toHaveBeenCalledWith(
      expect.objectContaining({
        hostUserId: 'user-99',
        title: 'マイ募集',
        candidateDates: ['2099-09-01', '2099-09-02'],
      }),
    );
  });

  it('guestLinkToken が 16 バイト base64url 形式で渡される', async () => {
    // Arrange
    const createWithHostAndCandidates = vi.fn().mockResolvedValue(mockLobby);
    const repo: CreateLobbyRepository = { createWithHostAndCandidates };

    // Act
    await createLobby(repo, 'user-1', {
      title: '募集',
      candidateDates: ['2099-09-01'],
    });

    // Assert
    const { guestLinkToken } = createWithHostAndCandidates.mock.calls[0]![0];
    expect(guestLinkToken).toMatch(/^[A-Za-z0-9_-]+$/);
    expect(guestLinkToken.length).toBeGreaterThan(10);
  });

  it('オプションフィールドを createWithHostAndCandidates に渡す', async () => {
    // Arrange
    const createWithHostAndCandidates = vi.fn().mockResolvedValue(mockLobby);
    const repo: CreateLobbyRepository = { createWithHostAndCandidates };

    // Act
    await createLobby(repo, 'user-1', {
      title: '詳細募集',
      description: '説明文',
      scenarioName: 'シナリオ名',
      location: '大阪',
      maxPlayers: 5,
      openUntil: '2099-09-01',
      candidateDates: ['2099-09-10'],
    });

    // Assert
    expect(createWithHostAndCandidates).toHaveBeenCalledWith(
      expect.objectContaining({
        description: '説明文',
        scenarioName: 'シナリオ名',
        location: '大阪',
        maxPlayers: 5,
        openUntil: '2099-09-01',
      }),
    );
  });
});
