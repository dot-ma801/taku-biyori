import { describe, expect, it, vi } from 'vitest';
import { listSeats } from '@/game-session/application/list-seats';
import type { ListSeatsRepository } from '@/game-session/application/list-seats';
import type { Seat } from '@taku-biyori/shared';

const LOBBY_ID = 'lobby-1';

/** 閲覧可否はロビーの `published_at` ファクトで決まる（design-v2 §6-13-4） */
const publishedLobby = {
  hostUserId: 'user-host',
  publishedAt: new Date('2026-08-01T00:00:00.000Z'),
};
const unpublishedLobby = { hostUserId: 'user-host', publishedAt: null };
const seat: Seat = {
  id: 'seat-1',
  entryId: 'entry-1',
  userId: 'user-2',
  userName: 'たくみ',
  guestName: null,
  characterName: 'アルベルト',
  seatedAt: '2026-08-30T10:00:00.000Z',
};

const makeRepo = (
  overrides: Partial<ListSeatsRepository> = {},
): ListSeatsRepository => ({
  findLobbyId: vi.fn().mockResolvedValue(LOBBY_ID),
  findLobbyForViewing: vi.fn().mockResolvedValue(publishedLobby),
  findSeatsByGameSessionId: vi.fn().mockResolvedValue([seat]),
  ...overrides,
});

describe('listSeats', () => {
  it('公開ロビーの着席者一覧は未ログインでも取得できる', async () => {
    // Arrange
    const repo = makeRepo();

    // Act
    const result = await listSeats(repo, LOBBY_ID, 'session-1', null);

    // Assert
    expect(result).toEqual({ type: 'ok', seats: [seat] });
  });

  it('セッションが無ければ notFound を返す', async () => {
    // Arrange
    const repo = makeRepo({ findLobbyId: vi.fn().mockResolvedValue(null) });

    // Act
    const result = await listSeats(repo, LOBBY_ID, 'session-1', null);

    // Assert
    expect(result).toEqual({ type: 'notFound' });
  });

  it('URL の lobbyId が所属ロビーと違えば notFound を返す', async () => {
    // Arrange
    const repo = makeRepo();

    // Act
    const result = await listSeats(repo, 'lobby-other', 'session-1', null);

    // Assert
    expect(result).toEqual({ type: 'notFound' });
  });

  it('未公開ロビーはホスト以外に forbidden を返す', async () => {
    // Arrange
    const repo = makeRepo({
      findLobbyForViewing: vi.fn().mockResolvedValue(unpublishedLobby),
    });

    // Act
    const result = await listSeats(repo, LOBBY_ID, 'session-1', 'user-2');

    // Assert
    expect(result).toEqual({ type: 'forbidden' });
  });

  it('着席が0件なら空配列を返す', async () => {
    // Arrange
    const repo = makeRepo({
      findSeatsByGameSessionId: vi.fn().mockResolvedValue([]),
    });

    // Act
    const result = await listSeats(repo, LOBBY_ID, 'session-1', null);

    // Assert
    expect(result).toEqual({ type: 'ok', seats: [] });
  });
});
