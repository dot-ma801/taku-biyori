import { describe, expect, it, vi } from 'vitest';
import { getLobby } from '@/lobby/application/get-lobby';
import type { GetLobbyRepository } from '@/lobby/application/get-lobby';
import type { LobbyDetail } from '@taku-biyori/shared';
import { LobbyStatus } from '@taku-biyori/shared';

const mockDetail: LobbyDetail = {
  id: 'lobby-1',
  title: 'テスト募集',
  status: LobbyStatus.open,
  publishedAt: '2026-01-01T00:00:00.000Z',
  receptionClosedAt: null,
  hostUserId: 'user-1',
  createdAt: '2025-01-01T00:00:00.000Z',
  updatedAt: '2025-01-01T00:00:00.000Z',
  entries: [],
  schedulePolls: [],
};

describe('getLobby', () => {
  it('公開済みなら未認証でも取得できる', async () => {
    // Arrange
    const repo: GetLobbyRepository = {
      findDetailById: vi.fn().mockResolvedValue(mockDetail),
    };

    // Act
    const result = await getLobby(repo, 'lobby-1', null);

    // Assert
    expect(result).toEqual({ type: 'ok', lobby: mockDetail });
  });

  it('存在しない場合は notFound を返す', async () => {
    // Arrange
    const repo: GetLobbyRepository = {
      findDetailById: vi.fn().mockResolvedValue(null),
    };

    // Act
    const result = await getLobby(repo, 'nonexistent', 'user-1');

    // Assert
    expect(result).toEqual({ type: 'notFound' });
  });

  it('非公開の場合ホスト以外は forbidden を返す', async () => {
    // Arrange
    const repo: GetLobbyRepository = {
      findDetailById: vi
        .fn()
        .mockResolvedValue({ ...mockDetail, publishedAt: null }),
    };

    // Act
    const result = await getLobby(repo, 'lobby-1', 'other-user');

    // Assert
    expect(result).toEqual({ type: 'forbidden' });
  });

  it('非公開でもホスト本人は取得できる', async () => {
    // Arrange
    const repo: GetLobbyRepository = {
      findDetailById: vi
        .fn()
        .mockResolvedValue({ ...mockDetail, publishedAt: null }),
    };

    // Act
    const result = await getLobby(repo, 'lobby-1', 'user-1');

    // Assert
    expect(result).toEqual({
      type: 'ok',
      lobby: { ...mockDetail, publishedAt: null },
    });
  });

  it('非公開で未認証は forbidden を返す', async () => {
    // Arrange
    const repo: GetLobbyRepository = {
      findDetailById: vi
        .fn()
        .mockResolvedValue({ ...mockDetail, publishedAt: null }),
    };

    // Act
    const result = await getLobby(repo, 'lobby-1', null);

    // Assert
    expect(result).toEqual({ type: 'forbidden' });
  });
});
