import { describe, expect, it, vi } from 'vitest';
import { createSeat } from '@/game-session/application/create-seat';
import type { CreateSeatRepository } from '@/game-session/application/create-seat';
import type { Seat } from '@taku-biyori/shared';

const LOBBY_ID = 'lobby-1';
const HOST = 'user-host';
const ENTRY_ID = 'entry-1';

const seat: Seat = {
  id: 'seat-1',
  entryId: ENTRY_ID,
  userId: 'user-2',
  userName: 'たくみ',
  guestName: null,
  characterName: null,
  seatedAt: '2026-08-30T10:00:00.000Z',
};

const makeRepo = (
  overrides: Partial<CreateSeatRepository> = {},
): CreateSeatRepository => ({
  findLobbyId: vi.fn().mockResolvedValue(LOBBY_ID),
  findHostUserId: vi.fn().mockResolvedValue(HOST),
  findStatusFields: vi.fn().mockResolvedValue({
    scheduledAt: '2026-09-01',
    completedAt: null,
    cancelledAt: null,
  }),
  findEntryLobbyId: vi.fn().mockResolvedValue(LOBBY_ID),
  addSeat: vi.fn().mockResolvedValue(seat),
  ...overrides,
});

describe('createSeat', () => {
  it('ホストは在籍中の参加者を着席させられる', async () => {
    // Arrange
    const repo = makeRepo();

    // Act
    const result = await createSeat(repo, LOBBY_ID, 'session-1', HOST, {
      entryId: ENTRY_ID,
    });

    // Assert
    expect(result).toEqual({ type: 'ok', seat });
  });

  it('ホスト以外は forbidden を返す（選出はホストの仕事。design-v2 §6-6）', async () => {
    // Arrange
    const repo = makeRepo();

    // Act
    const result = await createSeat(repo, LOBBY_ID, 'session-1', 'user-2', {
      entryId: ENTRY_ID,
    });

    // Assert
    expect(result).toEqual({ type: 'forbidden' });
    expect(repo.addSeat).not.toHaveBeenCalled();
  });

  it('別のロビーの LobbyEntry を着席させようとしたら invalidEntry を返す', async () => {
    // Arrange
    // seats.lobby_entry_id のロビーと game_sessions.lobby_id の一致は
    // DB 制約では表現できないためここで検証する（design-v2 §3-8）
    const repo = makeRepo({
      findEntryLobbyId: vi.fn().mockResolvedValue('lobby-other'),
    });

    // Act
    const result = await createSeat(repo, LOBBY_ID, 'session-1', HOST, {
      entryId: ENTRY_ID,
    });

    // Assert
    expect(result).toEqual({ type: 'invalidEntry' });
    expect(repo.addSeat).not.toHaveBeenCalled();
  });

  it('脱退済みの entry を着席させようとしたら invalidEntry を返す', async () => {
    // Arrange
    // findEntryLobbyId は left_at IS NULL で絞るので、脱退済みは null が返る
    const repo = makeRepo({
      findEntryLobbyId: vi.fn().mockResolvedValue(null),
    });

    // Act
    const result = await createSeat(repo, LOBBY_ID, 'session-1', HOST, {
      entryId: ENTRY_ID,
    });

    // Assert
    expect(result).toEqual({ type: 'invalidEntry' });
  });

  it.each([
    ['完了', { completedAt: new Date(), cancelledAt: null }],
    ['中止', { completedAt: null, cancelledAt: new Date() }],
  ])('%sした開催には着席させられない', async (_label, terminal) => {
    // Arrange
    const repo = makeRepo({
      findStatusFields: vi
        .fn()
        .mockResolvedValue({ scheduledAt: '2026-09-01', ...terminal }),
    });

    // Act
    const result = await createSeat(repo, LOBBY_ID, 'session-1', HOST, {
      entryId: ENTRY_ID,
    });

    // Assert
    expect(result).toEqual({ type: 'invalidStatus' });
  });

  it('すでに着席していれば alreadySeated を返す', async () => {
    // Arrange
    // unique (game_session_id, lobby_entry_id) 違反で addSeat が null を返す
    const repo = makeRepo({ addSeat: vi.fn().mockResolvedValue(null) });

    // Act
    const result = await createSeat(repo, LOBBY_ID, 'session-1', HOST, {
      entryId: ENTRY_ID,
    });

    // Assert
    expect(result).toEqual({ type: 'alreadySeated' });
  });

  it('URL の lobbyId が所属ロビーと違えば notFound を返す', async () => {
    // Arrange
    const repo = makeRepo();

    // Act
    const result = await createSeat(repo, 'lobby-other', 'session-1', HOST, {
      entryId: ENTRY_ID,
    });

    // Assert
    expect(result).toEqual({ type: 'notFound' });
  });
});
