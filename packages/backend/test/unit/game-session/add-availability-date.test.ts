import { describe, expect, it, vi } from 'vitest';
import { addAvailabilityDate } from '@/game-session/application/add-availability-date';
import type { AddAvailabilityDateRepository } from '@/game-session/application/add-availability-date';
import type { AvailabilityDate } from '@taku-biyori/shared';

const mockDate: AvailabilityDate = {
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
    scheduledAt: null,
    completedAt: null,
  }),
  addDate: vi.fn().mockResolvedValue(mockDate),
  ...overrides,
});

describe('addAvailabilityDate', () => {
  it('ホストが候補日を追加できる', async () => {
    // Arrange
    const repo = makeRepo();

    // Act
    const result = await addAvailabilityDate(repo, 'session-1', 'user-1', {
      date: '2025-09-01',
    });

    // Assert
    expect(result).toEqual({ type: 'ok', date: mockDate });
  });

  it('存在しないセッションIDは notFound を返す', async () => {
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
    const result = await addAvailabilityDate(repo, 'session-1', 'user-1', {
      date: '2025-09-01',
    });

    // Assert
    expect(result).toEqual({ type: 'forbidden' });
  });

  it('日程が確定済みの場合は conflict を返す', async () => {
    // Arrange
    const repo = makeRepo({
      findStatusFields: vi.fn().mockResolvedValue({
        isPublished: true,
        openUntil: null,
        scheduledAt: new Date('2026-06-30'),
        completedAt: null,
      }),
    });

    // Act
    const result = await addAvailabilityDate(repo, 'session-1', 'user-1', {
      date: '2026-07-01',
    });

    // Assert
    expect(result).toEqual({ type: 'conflict' });
  });

  it('addDate に gameSessionId と date を渡す', async () => {
    // Arrange
    const addDate = vi.fn().mockResolvedValue(mockDate);
    const repo = makeRepo({ addDate });

    // Act
    await addAvailabilityDate(repo, 'session-1', 'user-1', {
      date: '2025-10-15',
    });

    // Assert
    expect(addDate).toHaveBeenCalledWith('session-1', '2025-10-15');
  });
});
