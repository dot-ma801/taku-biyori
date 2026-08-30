import { describe, expect, it, vi } from 'vitest';
import { joinLobby } from '@/lobby/application/join-lobby';
import type { JoinLobbyRepository } from '@/lobby/application/join-lobby';
import type { LobbyEntry } from '@taku-biyori/shared';
import { LobbyStatus } from '@taku-biyori/shared';

const mockEntry: LobbyEntry = {
  id: 'entry-2',
  userId: 'user-2',
  userName: '新規ユーザー',
  guestName: null,
  joinedAt: '2025-01-01T00:00:00.000Z',
  leftAt: null,
};

const makeRepo = (
  overrides: Partial<JoinLobbyRepository> = {},
): JoinLobbyRepository => ({
  findLobbyStatus: vi.fn().mockResolvedValue(LobbyStatus.open),
  findEntryByUserId: vi.fn().mockResolvedValue(null),
  rejoinEntry: vi.fn().mockResolvedValue({ ...mockEntry, leftAt: null }),
  addEntry: vi.fn().mockResolvedValue(mockEntry),
  ...overrides,
});

describe('joinLobby', () => {
  it('ユーザーが募集枠に参加できる', async () => {
    // Arrange
    const repo = makeRepo();

    // Act
    const result = await joinLobby(repo, 'lobby-1', 'user-2', {});

    // Assert
    expect(result).toEqual({ type: 'ok', entry: mockEntry });
  });

  it('存在しない募集枠IDは notFound を返す', async () => {
    // Arrange
    const repo = makeRepo({
      findLobbyStatus: vi.fn().mockResolvedValue(null),
    });

    // Act
    const result = await joinLobby(repo, 'nonexistent', 'user-2', {});

    // Assert
    expect(result).toEqual({ type: 'notFound' });
  });

  it.each([LobbyStatus.draft, LobbyStatus.closed, LobbyStatus.disbanded])(
    'status が %s（open でない）場合は lobbyNotOpen を返す',
    async (status) => {
      // Arrange
      const repo = makeRepo({
        findLobbyStatus: vi.fn().mockResolvedValue(status),
      });

      // Act
      const result = await joinLobby(repo, 'lobby-1', 'user-2', {});

      // Assert
      expect(result).toEqual({ type: 'lobbyNotOpen' });
    },
  );

  it('すでに在籍中のユーザーは alreadyJoined を返す', async () => {
    // Arrange
    const repo = makeRepo({
      findEntryByUserId: vi
        .fn()
        .mockResolvedValue({ id: 'entry-2', leftAt: null }),
    });

    // Act
    const result = await joinLobby(repo, 'lobby-1', 'user-2', {});

    // Assert
    expect(result).toEqual({ type: 'alreadyJoined' });
  });

  it('DB 一意制約違反（addEntry が null）の場合も alreadyJoined を返す', async () => {
    // Arrange
    const repo = makeRepo({ addEntry: vi.fn().mockResolvedValue(null) });

    // Act
    const result = await joinLobby(repo, 'lobby-1', 'user-2', {});

    // Assert
    expect(result).toEqual({ type: 'alreadyJoined' });
  });

  describe('再参加', () => {
    it('脱退済みの行が残っていれば left_at を戻して復帰する（新しい行は作らない）', async () => {
      // Arrange
      const rejoinEntry = vi.fn().mockResolvedValue(mockEntry);
      const addEntry = vi.fn();
      const repo = makeRepo({
        findEntryByUserId: vi.fn().mockResolvedValue({
          id: 'entry-2',
          leftAt: new Date('2026-08-10T00:00:00.000Z'),
        }),
        rejoinEntry,
        addEntry,
      });

      // Act
      const result = await joinLobby(repo, 'lobby-1', 'user-2', {});

      // Assert
      expect(result).toEqual({ type: 'ok', entry: mockEntry });
      expect(rejoinEntry).toHaveBeenCalledWith('entry-2');
      expect(addEntry).not.toHaveBeenCalled();
    });

    it('復帰の条件付き UPDATE が0行なら alreadyJoined（並行リクエストに先を越された）', async () => {
      // Arrange
      const repo = makeRepo({
        findEntryByUserId: vi.fn().mockResolvedValue({
          id: 'entry-2',
          leftAt: new Date('2026-08-10T00:00:00.000Z'),
        }),
        rejoinEntry: vi.fn().mockResolvedValue(null),
      });

      // Act
      const result = await joinLobby(repo, 'lobby-1', 'user-2', {});

      // Assert
      expect(result).toEqual({ type: 'alreadyJoined' });
    });
  });

  it('addEntry に lobbyId・userId・input を渡す', async () => {
    // Arrange
    const addEntry = vi.fn().mockResolvedValue(mockEntry);
    const repo = makeRepo({ addEntry });

    // Act
    await joinLobby(repo, 'lobby-1', 'user-2', {});

    // Assert
    expect(addEntry).toHaveBeenCalledWith('lobby-1', 'user-2', {});
  });
});
