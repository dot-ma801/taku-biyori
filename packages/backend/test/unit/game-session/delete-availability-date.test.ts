import { describe, expect, it, vi } from 'vitest';
import { deleteAvailabilityDate } from '@/game-session/application/delete-availability-date';
import type { DeleteAvailabilityDateRepository } from '@/game-session/application/delete-availability-date';

const makeRepo = (
  overrides: Partial<DeleteAvailabilityDateRepository> = {},
): DeleteAvailabilityDateRepository => ({
  findHostUserId: vi.fn().mockResolvedValue('user-1'),
  findStatusFields: vi.fn().mockResolvedValue({
    isPublished: true,
    openUntil: null,
    scheduledAt: null,
    completedAt: null,
  }),
  findCandidateOwner: vi.fn().mockResolvedValue({ gameSessionId: 'session-1' }),
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
      'session-1',
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
      'session-1',
      'nonexistent',
      'user-1',
    );

    // Assert
    expect(result).toEqual({ type: 'notFound' });
  });

  it('候補日が別セッションに属する場合は notFound を返す', async () => {
    // Arrange
    const repo = makeRepo({
      findCandidateOwner: vi
        .fn()
        .mockResolvedValue({ gameSessionId: 'other-session' }),
    });

    // Act
    const result = await deleteAvailabilityDate(
      repo,
      'session-1',
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
      'session-1',
      'date-1',
      'user-1',
    );

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
    const result = await deleteAvailabilityDate(
      repo,
      'session-1',
      'date-1',
      'user-1',
    );

    // Assert
    expect(result).toEqual({ type: 'conflict' });
  });

  it('deleteDateById に dateId を渡す', async () => {
    // Arrange
    const deleteDateById = vi.fn().mockResolvedValue(undefined);
    const repo = makeRepo({ deleteDateById });

    // Act
    await deleteAvailabilityDate(repo, 'session-1', 'date-99', 'user-1');

    // Assert
    expect(deleteDateById).toHaveBeenCalledWith('date-99');
  });
});
