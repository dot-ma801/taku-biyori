import { describe, expect, it, vi } from 'vitest';
import { deleteSeat } from '@/game-session/application/delete-seat';
import type { DeleteSeatRepository } from '@/game-session/application/delete-seat';

const LOBBY_ID = 'lobby-1';
const HOST = 'user-host';
const OWNER = 'user-2';

const makeRepo = (
  overrides: Partial<DeleteSeatRepository> = {},
): DeleteSeatRepository => ({
  findLobbyId: vi.fn().mockResolvedValue(LOBBY_ID),
  findHostUserId: vi.fn().mockResolvedValue(HOST),
  findStatusFields: vi.fn().mockResolvedValue({
    scheduledAt: '2026-09-01',
    completedAt: null,
    cancelledAt: null,
  }),
  findSeatOwner: vi
    .fn()
    .mockResolvedValue({ gameSessionId: 'session-1', userId: OWNER }),
  deleteSeatById: vi.fn().mockResolvedValue(undefined),
  ...overrides,
});

describe('deleteSeat', () => {
  it('本人は離席できる', async () => {
    // Arrange
    const repo = makeRepo();

    // Act
    const result = await deleteSeat(repo, LOBBY_ID, 'session-1', 'seat-1', OWNER);

    // Assert
    expect(result).toEqual({ type: 'ok' });
    expect(repo.deleteSeatById).toHaveBeenCalledWith('seat-1');
  });

  it('ホストは他人を離席させられる（選出の取り消し）', async () => {
    // Arrange
    const repo = makeRepo();

    // Act
    const result = await deleteSeat(repo, LOBBY_ID, 'session-1', 'seat-1', HOST);

    // Assert
    expect(result).toEqual({ type: 'ok' });
  });

  it('ホストはゲストの席も外せる（userId が null でも本人性で詰まらない）', async () => {
    // Arrange
    const repo = makeRepo({
      findSeatOwner: vi
        .fn()
        .mockResolvedValue({ gameSessionId: 'session-1', userId: null }),
    });

    // Act
    const result = await deleteSeat(repo, LOBBY_ID, 'session-1', 'seat-1', HOST);

    // Assert
    expect(result).toEqual({ type: 'ok' });
  });

  it('本人でもホストでもなければ forbidden を返す', async () => {
    // Arrange
    const repo = makeRepo();

    // Act
    const result = await deleteSeat(repo, LOBBY_ID, 'session-1', 'seat-1', 'user-9');

    // Assert
    expect(result).toEqual({ type: 'forbidden' });
    expect(repo.deleteSeatById).not.toHaveBeenCalled();
  });

  it.each([
    ['完了', { completedAt: new Date(), cancelledAt: null }],
    ['中止', { completedAt: null, cancelledAt: new Date() }],
  ])('%sした開催では離席できない', async (_label, terminal) => {
    // Arrange
    const repo = makeRepo({
      findStatusFields: vi
        .fn()
        .mockResolvedValue({ scheduledAt: '2026-09-01', ...terminal }),
    });

    // Act
    const result = await deleteSeat(repo, LOBBY_ID, 'session-1', 'seat-1', OWNER);

    // Assert
    expect(result).toEqual({ type: 'invalidStatus' });
  });

  it('seatId が別のセッションの席なら notFound を返す', async () => {
    // Arrange
    const repo = makeRepo({
      findSeatOwner: vi
        .fn()
        .mockResolvedValue({ gameSessionId: 'session-other', userId: OWNER }),
    });

    // Act
    const result = await deleteSeat(repo, LOBBY_ID, 'session-1', 'seat-1', OWNER);

    // Assert
    expect(result).toEqual({ type: 'notFound' });
  });
});
