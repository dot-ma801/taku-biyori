import { beforeEach, describe, expect, it, vi } from 'vitest';
import { GUEST_TOKEN_HEADER } from '@taku-biyori/shared';
import { joinLobby, joinLobbyAsGuest, leaveLobby } from '@/api/lobby';
import { apiRequest } from '@/lib/api-client';

vi.mock('@/lib/api-client', () => ({ apiRequest: vi.fn() }));

const apiRequestMock = vi.mocked(apiRequest);

const entryDto = {
  id: 'entry-1',
  userId: 'user-1',
  userName: 'あさひ',
  guestName: null,
  joinedAt: '2026-08-01T00:00:00.000Z',
  leftAt: null,
};

/**
 * 参加系エンドポイントのパスを固定する。
 *
 * バックエンドのルートを `/members` から `/entries` へ改名したとき、
 * ここが追随できていないと参加・脱退が 404 になる。composable のテストは
 * この層をモックするため気づけない（issue #113 のレビュー指摘）。
 */
describe('lobby api — 参加系のパス', () => {
  beforeEach(() => {
    apiRequestMock.mockReset();
    apiRequestMock.mockResolvedValue(entryDto);
  });

  it('joinLobby は POST /api/lobbies/:id/entries を呼ぶ', async () => {
    // Arrange / Act
    await joinLobby('lobby-1', {});

    // Assert
    expect(apiRequestMock).toHaveBeenCalledWith(
      '/api/lobbies/lobby-1/entries',
      expect.objectContaining({ method: 'POST' }),
    );
  });

  it('leaveLobby は DELETE /api/lobbies/:id/entries/:entryId を呼ぶ', async () => {
    // Arrange / Act
    await leaveLobby('lobby-1', 'entry-1');

    // Assert
    expect(apiRequestMock).toHaveBeenCalledWith(
      '/api/lobbies/lobby-1/entries/entry-1',
      expect.objectContaining({ method: 'DELETE' }),
    );
  });

  it('joinLobbyAsGuest は POST /api/lobbies/:id/guest-entries をトークン付きで呼ぶ', async () => {
    // Arrange / Act
    await joinLobbyAsGuest('lobby-1', 'token-1', { guestName: 'そら' });

    // Assert
    expect(apiRequestMock).toHaveBeenCalledWith(
      '/api/lobbies/lobby-1/guest-entries',
      expect.objectContaining({
        method: 'POST',
        headers: { [GUEST_TOKEN_HEADER]: 'token-1' },
      }),
    );
  });
});
