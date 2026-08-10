import { describe, expect, it, vi } from 'vitest';
import { addAvailabilityDate } from '@/lobby/application/add-availability-date';
import type { AddAvailabilityDateRepository } from '@/lobby/application/add-availability-date';
import type { LobbyAvailabilityDate } from '@taku-biyori/shared';

const mockDate: LobbyAvailabilityDate = {
  id: 'date-1',
  date: '2025-09-01',
  answers: [],
};

const makeRepo = (
  overrides: Partial<AddAvailabilityDateRepository> = {},
): AddAvailabilityDateRepository => ({
  findHostUserId: vi.fn().mockResolvedValue('user-1'),
  findStatusFields: vi.fn().mockResolvedValue({
    isPublished: true,
    openUntil: null,
    closedAt: null,
    cancelledAt: null,
  }),
  addDate: vi.fn().mockResolvedValue(mockDate),
  ...overrides,
});

describe('addAvailabilityDate', () => {
  it('ホストが候補日を追加できる', async () => {
    // Arrange
    const repo = makeRepo();

    // Act
    const result = await addAvailabilityDate(repo, 'lobby-1', 'user-1', {
      date: '2025-09-01',
    });

    // Assert
    expect(result).toEqual({ type: 'ok', date: mockDate });
  });

  it('存在しない募集枠IDは notFound を返す', async () => {
    // Arrange
    const repo = makeRepo({ findHostUserId: vi.fn().mockResolvedValue(null) });

    // Act
    const result = await addAvailabilityDate(repo, 'nonexistent', 'user-1', {
      date: '2025-09-01',
    });

    // Assert
    expect(result).toEqual({ type: 'notFound' });
  });

  it('ホスト以外は forbidden を返す', async () => {
    // Arrange
    const repo = makeRepo({
      findHostUserId: vi.fn().mockResolvedValue('other-user'),
    });

    // Act
    const result = await addAvailabilityDate(repo, 'lobby-1', 'user-1', {
      date: '2025-09-01',
    });

    // Assert
    expect(result).toEqual({ type: 'forbidden' });
  });

  it('募集枠が確定済みの場合は invalidStatus を返す', async () => {
    // Arrange
    const repo = makeRepo({
      findStatusFields: vi.fn().mockResolvedValue({
        isPublished: true,
        openUntil: new Date('2026-01-01'),
        closedAt: new Date('2026-06-30'),
        cancelledAt: null,
      }),
    });

    // Act
    const result = await addAvailabilityDate(repo, 'lobby-1', 'user-1', {
      date: '2026-07-01',
    });

    // Assert
    expect(result).toEqual({ type: 'invalidStatus' });
  });

  it('募集枠が中止済みの場合は invalidStatus を返す', async () => {
    // Arrange
    const repo = makeRepo({
      findStatusFields: vi.fn().mockResolvedValue({
        isPublished: true,
        openUntil: null,
        closedAt: null,
        cancelledAt: new Date('2026-01-01'),
      }),
    });

    // Act
    const result = await addAvailabilityDate(repo, 'lobby-1', 'user-1', {
      date: '2026-07-01',
    });

    // Assert
    expect(result).toEqual({ type: 'invalidStatus' });
  });

  it('addDate に lobbyId・date・timeNote を渡す', async () => {
    // Arrange
    const addDate = vi.fn().mockResolvedValue(mockDate);
    const repo = makeRepo({ addDate });

    // Act
    await addAvailabilityDate(repo, 'lobby-1', 'user-1', {
      date: '2025-10-15',
    });

    // Assert
    expect(addDate).toHaveBeenCalledWith('lobby-1', '2025-10-15', null);
  });
});
