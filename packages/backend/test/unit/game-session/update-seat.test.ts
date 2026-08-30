import { describe, expect, it, vi } from 'vitest';
import { updateSeat } from '@/game-session/application/update-seat';
import type { UpdateSeatRepository } from '@/game-session/application/update-seat';
import type { Seat } from '@taku-biyori/shared';

const LOBBY_ID = 'lobby-1';
const HOST = 'user-host';
const OWNER = 'user-2';

const seat: Seat = {
  id: 'seat-1',
  entryId: 'entry-1',
  userId: OWNER,
  userName: 'たくみ',
  guestName: null,
  characterName: 'アルベルト',
  seatedAt: '2026-08-30T10:00:00.000Z',
};

const makeRepo = (
  overrides: Partial<UpdateSeatRepository> = {},
): UpdateSeatRepository => ({
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
  updateSeatCharacterName: vi.fn().mockResolvedValue(seat),
  ...overrides,
});

describe('updateSeat', () => {
  it('本人はキャラクター名を割り当てられる', async () => {
    // Arrange
    const repo = makeRepo();

    // Act
    const result = await updateSeat(
      repo,
      LOBBY_ID,
      'session-1',
      'seat-1',
      OWNER,
      {
        characterName: 'アルベルト',
      },
    );

    // Assert
    expect(result).toEqual({ type: 'ok', seat });
  });

  it('ホストも他人の席のキャラクター名を更新できる', async () => {
    // Arrange
    const repo = makeRepo();

    // Act
    const result = await updateSeat(
      repo,
      LOBBY_ID,
      'session-1',
      'seat-1',
      HOST,
      {
        characterName: 'アルベルト',
      },
    );

    // Assert
    expect(result.type).toBe('ok');
  });

  it('本人でもホストでもなければ forbidden を返す', async () => {
    // Arrange
    const repo = makeRepo();

    // Act
    const result = await updateSeat(
      repo,
      LOBBY_ID,
      'session-1',
      'seat-1',
      'user-9',
      {
        characterName: 'x',
      },
    );

    // Assert
    expect(result).toEqual({ type: 'forbidden' });
  });

  it('null で割り当てを解除できる', async () => {
    // Arrange
    const repo = makeRepo();

    // Act
    await updateSeat(repo, LOBBY_ID, 'session-1', 'seat-1', OWNER, {
      characterName: null,
    });

    // Assert
    expect(repo.updateSeatCharacterName).toHaveBeenCalledWith('seat-1', null);
  });

  it('完了した開催でも更新できる（あとからキャラ名を埋める運用がある）', async () => {
    // Arrange
    const repo = makeRepo({
      findStatusFields: vi.fn().mockResolvedValue({
        scheduledAt: '2026-09-01',
        completedAt: new Date(),
        cancelledAt: null,
      }),
    });

    // Act
    const result = await updateSeat(
      repo,
      LOBBY_ID,
      'session-1',
      'seat-1',
      OWNER,
      {
        characterName: 'アルベルト',
      },
    );

    // Assert
    expect(result.type).toBe('ok');
  });

  it('中止した開催では更新できない', async () => {
    // Arrange
    const repo = makeRepo({
      findStatusFields: vi.fn().mockResolvedValue({
        scheduledAt: '2026-09-01',
        completedAt: null,
        cancelledAt: new Date(),
      }),
    });

    // Act
    const result = await updateSeat(
      repo,
      LOBBY_ID,
      'session-1',
      'seat-1',
      OWNER,
      {
        characterName: 'x',
      },
    );

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
    const result = await updateSeat(
      repo,
      LOBBY_ID,
      'session-1',
      'seat-1',
      OWNER,
      {
        characterName: 'x',
      },
    );

    // Assert
    expect(result).toEqual({ type: 'notFound' });
  });
});
