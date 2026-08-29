import { describe, expect, it, vi } from 'vitest';
import { listAvailabilityDates } from '@/lobby/application/list-availability-dates';
import type { ListAvailabilityDatesRepository } from '@/lobby/application/list-availability-dates';
import type { LobbyAvailabilityDate } from '@taku-biyori/shared';

const mockDates: LobbyAvailabilityDate[] = [
  { id: 'date-1', date: '2025-09-01', dateNote: null, answers: [] },
  { id: 'date-2', date: '2025-09-08', dateNote: null, answers: [] },
];

const makeRepo = (
  overrides: Partial<ListAvailabilityDatesRepository> = {},
): ListAvailabilityDatesRepository => ({
  findLobbyVisibility: vi
    .fn()
    .mockResolvedValue({
      publishedAt: new Date('2026-08-01T00:00:00.000Z'),
      hostUserId: 'user-1',
    }),
  findByLobbyId: vi.fn().mockResolvedValue(mockDates),
  ...overrides,
});

describe('listAvailabilityDates', () => {
  it('募集枠の候補日一覧を返す', async () => {
    // Arrange
    const repo = makeRepo();

    // Act
    const result = await listAvailabilityDates(repo, 'lobby-1', 'user-1');

    // Assert
    expect(result).toEqual({ type: 'ok', dates: mockDates });
  });

  it('存在しない募集枠IDは notFound を返す', async () => {
    // Arrange
    const repo = makeRepo({
      findLobbyVisibility: vi.fn().mockResolvedValue(null),
    });

    // Act
    const result = await listAvailabilityDates(repo, 'nonexistent', 'user-1');

    // Assert
    expect(result).toEqual({ type: 'notFound' });
  });

  it('非公開募集枠にホスト以外がアクセスすると forbidden を返す', async () => {
    // Arrange
    const repo = makeRepo({
      findLobbyVisibility: vi
        .fn()
        .mockResolvedValue({ publishedAt: null, hostUserId: 'user-1' }),
    });

    // Act
    const result = await listAvailabilityDates(repo, 'lobby-1', 'user-2');

    // Assert
    expect(result).toEqual({ type: 'forbidden' });
  });

  it('非公開募集枠でもホスト本人は閲覧できる', async () => {
    // Arrange
    const repo = makeRepo({
      findLobbyVisibility: vi
        .fn()
        .mockResolvedValue({ publishedAt: null, hostUserId: 'user-1' }),
    });

    // Act
    const result = await listAvailabilityDates(repo, 'lobby-1', 'user-1');

    // Assert
    expect(result).toEqual({ type: 'ok', dates: mockDates });
  });

  it('募集枠が存在する場合 findByLobbyId を呼ぶ', async () => {
    // Arrange
    const findByLobbyId = vi.fn().mockResolvedValue([]);
    const repo = makeRepo({ findByLobbyId });

    // Act
    await listAvailabilityDates(repo, 'lobby-99', 'user-1');

    // Assert
    expect(findByLobbyId).toHaveBeenCalledWith('lobby-99');
  });
});
