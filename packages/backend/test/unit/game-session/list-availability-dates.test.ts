import { describe, expect, it, vi } from 'vitest';
import { listAvailabilityDates } from '@/game-session/application/list-availability-dates';
import type { ListAvailabilityDatesRepository } from '@/game-session/application/list-availability-dates';
import type { AvailabilityDate } from '@taku-biyori/shared';

const mockDates: AvailabilityDate[] = [
  { id: 'date-1', date: '2025-09-01', answers: [] },
  { id: 'date-2', date: '2025-09-08', answers: [] },
];

const makeRepo = (
  overrides: Partial<ListAvailabilityDatesRepository> = {},
): ListAvailabilityDatesRepository => ({
  gameSessionExists: vi.fn().mockResolvedValue(true),
  findByGameSessionId: vi.fn().mockResolvedValue(mockDates),
  ...overrides,
});

describe('listAvailabilityDates', () => {
  it('セッションの候補日一覧を返す', async () => {
    // Arrange
    const repo = makeRepo();

    // Act
    const result = await listAvailabilityDates(repo, 'session-1');

    // Assert
    expect(result).toEqual({ type: 'ok', dates: mockDates });
  });

  it('存在しないセッションIDは notFound を返す', async () => {
    // Arrange
    const repo = makeRepo({
      gameSessionExists: vi.fn().mockResolvedValue(false),
    });

    // Act
    const result = await listAvailabilityDates(repo, 'nonexistent');

    // Assert
    expect(result).toEqual({ type: 'notFound' });
  });

  it('セッションが存在する場合 findByGameSessionId を呼ぶ', async () => {
    // Arrange
    const findByGameSessionId = vi.fn().mockResolvedValue([]);
    const repo = makeRepo({ findByGameSessionId });

    // Act
    await listAvailabilityDates(repo, 'session-99');

    // Assert
    expect(findByGameSessionId).toHaveBeenCalledWith('session-99');
  });
});
