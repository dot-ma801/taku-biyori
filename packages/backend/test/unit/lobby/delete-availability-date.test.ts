import { describe, expect, it, vi } from 'vitest';
import { deleteAvailabilityDate } from '@/lobby/application/delete-availability-date';
import type { DeleteAvailabilityDateRepository } from '@/lobby/application/delete-availability-date';

const makeRepo = (
  overrides: Partial<DeleteAvailabilityDateRepository> = {},
): DeleteAvailabilityDateRepository => ({
  findHostUserId: vi.fn().mockResolvedValue('user-1'),
  findStatusFields: vi.fn().mockResolvedValue({
    isPublished: true,
    openUntil: null,
    closedAt: null,
    cancelledAt: null,
  }),
  findCandidateOwner: vi.fn().mockResolvedValue({ lobbyId: 'lobby-1' }),
  deleteDateById: vi.fn().mockResolvedValue(undefined),
  ...overrides,
});

describe('deleteAvailabilityDate', () => {
  it('ホストが候補日を削除できる', async () => {
    // Arrange
    const repo = makeRepo();

    // Act
    const result = await deleteAvailabilityDate(
      repo,
      'lobby-1',
      'date-1',
      'user-1',
    );

    // Assert
    expect(result).toEqual({ type: 'ok' });
  });

  it('存在しない候補日IDは notFound を返す', async () => {
    // Arrange
    const repo = makeRepo({
      findCandidateOwner: vi.fn().mockResolvedValue(null),
    });

    // Act
    const result = await deleteAvailabilityDate(
      repo,
      'lobby-1',
      'nonexistent',
      'user-1',
    );

    // Assert
    expect(result).toEqual({ type: 'notFound' });
  });

  it('候補日が別募集枠に属する場合は notFound を返す', async () => {
    // Arrange
    const repo = makeRepo({
      findCandidateOwner: vi.fn().mockResolvedValue({ lobbyId: 'other-lobby' }),
    });

    // Act
    const result = await deleteAvailabilityDate(
      repo,
      'lobby-1',
      'date-1',
      'user-1',
    );

    // Assert
    expect(result).toEqual({ type: 'notFound' });
  });

  it('ホスト以外は forbidden を返す', async () => {
    // Arrange
    const repo = makeRepo({
      findHostUserId: vi.fn().mockResolvedValue('other-user'),
    });

    // Act
    const result = await deleteAvailabilityDate(
      repo,
      'lobby-1',
      'date-1',
      'user-1',
    );

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
    const result = await deleteAvailabilityDate(
      repo,
      'lobby-1',
      'date-1',
      'user-1',
    );

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
    const result = await deleteAvailabilityDate(
      repo,
      'lobby-1',
      'date-1',
      'user-1',
    );

    // Assert
    expect(result).toEqual({ type: 'invalidStatus' });
  });

  it('deleteDateById に dateId を渡す', async () => {
    // Arrange
    const deleteDateById = vi.fn().mockResolvedValue(undefined);
    const repo = makeRepo({ deleteDateById });

    // Act
    await deleteAvailabilityDate(repo, 'lobby-1', 'date-99', 'user-1');

    // Assert
    expect(deleteDateById).toHaveBeenCalledWith('date-99');
  });
});
