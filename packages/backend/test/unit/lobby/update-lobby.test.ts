import { describe, expect, it, vi } from 'vitest';
import { updateLobby } from '@/lobby/application/update-lobby';
import type { UpdateLobbyRepository } from '@/lobby/application/update-lobby';
import { LobbyStatus } from '@taku-biyori/shared';
import type { Lobby } from '@taku-biyori/shared';

const mockLobby: Lobby = {
  id: 'lobby-1',
  title: '更新後',
  status: 'draft',
  isPublished: false,
  hostUserId: 'user-1',
  createdAt: '2025-01-01T00:00:00.000Z',
  updatedAt: '2025-01-01T00:00:00.000Z',
};

function makeRepo(
  overrides: Partial<UpdateLobbyRepository> = {},
): UpdateLobbyRepository {
  return {
    findHostUserId: vi.fn().mockResolvedValue('user-1'),
    findLobbyStatus: vi.fn().mockResolvedValue(LobbyStatus.draft),
    updateById: vi.fn().mockResolvedValue(mockLobby),
    ...overrides,
  };
}

describe('updateLobby', () => {
  it('ホストが更新すると ok を返す', async () => {
    // Arrange
    const repo = makeRepo();

    // Act
    const result = await updateLobby(repo, 'lobby-1', 'user-1', {
      title: '更新後',
    });

    // Assert
    expect(result).toEqual({ type: 'ok', lobby: mockLobby });
  });

  it('存在しない場合は notFound を返す', async () => {
    // Arrange
    const repo = makeRepo({ findHostUserId: vi.fn().mockResolvedValue(null) });

    // Act
    const result = await updateLobby(repo, 'nonexistent', 'user-1', {
      title: 'x',
    });

    // Assert
    expect(result).toEqual({ type: 'notFound' });
  });

  it('ホストでない場合は forbidden を返す', async () => {
    // Arrange
    const repo = makeRepo();

    // Act
    const result = await updateLobby(repo, 'lobby-1', 'other-user', {
      title: 'x',
    });

    // Assert
    expect(result).toEqual({ type: 'forbidden' });
  });

  it('confirmed の場合は invalidStatus を返す', async () => {
    // Arrange
    const repo = makeRepo({
      findLobbyStatus: vi.fn().mockResolvedValue(LobbyStatus.confirmed),
      updateById: vi.fn(),
    });

    // Act
    const result = await updateLobby(repo, 'lobby-1', 'user-1', {
      title: 'x',
    });

    // Assert
    expect(result).toEqual({ type: 'invalidStatus' });
    expect(repo.updateById).not.toHaveBeenCalled();
  });

  it('cancelled の場合は invalidStatus を返す', async () => {
    // Arrange
    const repo = makeRepo({
      findLobbyStatus: vi.fn().mockResolvedValue(LobbyStatus.cancelled),
      updateById: vi.fn(),
    });

    // Act
    const result = await updateLobby(repo, 'lobby-1', 'user-1', {
      title: 'x',
    });

    // Assert
    expect(result).toEqual({ type: 'invalidStatus' });
    expect(repo.updateById).not.toHaveBeenCalled();
  });

  it('open の場合は更新できる', async () => {
    // Arrange
    const repo = makeRepo({
      findLobbyStatus: vi.fn().mockResolvedValue(LobbyStatus.open),
    });

    // Act
    const result = await updateLobby(repo, 'lobby-1', 'user-1', {
      title: 'x',
    });

    // Assert
    expect(result).toEqual({ type: 'ok', lobby: mockLobby });
  });

  it('scheduling の場合は更新できる', async () => {
    // Arrange
    const repo = makeRepo({
      findLobbyStatus: vi.fn().mockResolvedValue(LobbyStatus.scheduling),
    });

    // Act
    const result = await updateLobby(repo, 'lobby-1', 'user-1', {
      title: 'x',
    });

    // Assert
    expect(result).toEqual({ type: 'ok', lobby: mockLobby });
  });
});
